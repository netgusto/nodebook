import * as chokidar from 'chokidar';
import { join as pathJoin, dirname, basename } from 'path';
import { lstat, lstatSync } from 'fs';
import * as globby from 'globby';
import RecipeRegistry from '../reciperegistry';
import { OnNotebookChangeType, Notebook } from '../../types';

export default class NotebookRegistry {

    private notebookspath: string;
    private depth: number;
    private watcher: any;
    private ready: boolean;
    private reciperegistry: RecipeRegistry;
    private onChange: OnNotebookChangeType;
    private notebookscache: Array<Notebook>;

    constructor(notebookspath: string, reciperegistry: RecipeRegistry, onChange: OnNotebookChangeType = undefined) {
        this.notebookspath = notebookspath;
        this.depth = 2;
        this.watcher = undefined;
        this.ready = false;
        this.reciperegistry = reciperegistry;
        this.onChange = onChange;

        this.notebookscache = [];
    }

    mount() {
        return new Promise((resolve, reject) => {

            const glob = pathJoin(this.notebookspath, '**', '{' + this.reciperegistry.getAllRecipesMainFiles().join(',') + '}');

            this.watcher = chokidar
                .watch(glob, {
                    depth: this.depth,
                    ignored: [
                        /(^|[\/\\])\../,            // dot files, dot dirs
                        /(^|[\/\\])node_modules/    // node_modules
                        // TODO: support .gitignore
                    ],
                    persistent: true,
                })
                .on('ready', () => {
                    
                    this.ready = true;
                    this.initializeRegistry(this.watcher.getWatched());

                    this.watcher
                        .on('add', (path: string) => this.addFile(path));
                    
                    if (this.onChange) {
                        this.watcher.on('change', (path: string) => this.addFile(path));
                    }

                    resolve();
                })
                .on('error', error => {
                    if (this.ready) {
                        console.error(`Watcher error: ${error}`);
                    } else {
                        reject(error);
                    }
                })
                ;
        });
    }

    initializeRegistry(files: any) {

        const notebookscache: Array<Notebook> = [];

        // identify basepath
        const keys = Object.keys(files);
        for (let i = 0; i < keys.length; i++) {
            const absdir = keys[i];
            const mainfilename = files[absdir][0];

            if (absdir === this.notebookspath) continue;    // do not list notebook dir as notebook

            const notebookname = this.determineNotebookNameByAbsDir(absdir);
            const notebook = this.buildNotebookDescriptor(notebookname, mainfilename);
            if (notebook) notebookscache.push(notebook);
        }

        this.notebookscache = notebookscache;
    }

    determineNotebookNameByAbsDir(absdir: string) {
        return absdir.substr(this.notebookspath.length + 1);
    }

    buildNotebookDescriptor(notebookname: string, mainfilename: string): (Notebook|undefined) {

        const recipe = this.reciperegistry.getRecipeForMainFilename(mainfilename);
        if (!recipe) return undefined;

        // TODO: improve this
        // Used right now for rust src/main.rs
        const parts = notebookname.split('/');

        if (parts.length > 1 && parts[1] === 'src' && recipe.key === 'rust') {
            mainfilename = parts.slice(1).join('/') + '/' + mainfilename;
            notebookname = parts[0];
        }

        const absdir = pathJoin(this.notebookspath, notebookname);
        const abspath = pathJoin(absdir, mainfilename)
    
        return {
            name: notebookname,
            mainfilename,
            absdir,
            abspath,
            mtime: lstatSync(abspath).mtime.toISOString(),
            recipe,
        };
    }

    unmount() {
        this.watcher.unwatch().close();
    }

    async addFile(absfile: string) {
        const absdir = dirname(absfile);
        const mainfile = basename(absfile);
        await this.refresh({
            name: this.determineNotebookNameByAbsDir(absdir),
            mainfile,
        });
    }

    getNotebooks() {
        return this.notebookscache;
    }

    getNotebookByName(name: string) {
        const index = this.getNotebookIndexByName(name);
        if (index === undefined) return undefined;

        return this.notebookscache[index];
    }

    getNotebookIndexByName(name: string) {
        const notebookIndex = this.notebookscache.findIndex(nb => nb.name === name);
        return notebookIndex > -1 ? notebookIndex : undefined;
    }

    async register({ name, mainfile, refresh = false }: { name: string, mainfile?: string, refresh?: boolean }) {

        const currentIdx = this.getNotebookIndexByName(name);
        if (currentIdx !== undefined && !refresh) return this.notebookscache[currentIdx];

        const absdir = pathJoin(this.notebookspath, name);
        const exists = await new Promise<boolean>(resolve => lstat(absdir, err => resolve(!err)));
        if (!exists) return undefined;

        if (mainfile === undefined) {
            const mainfiles = await this.globAllRecipesMainFiles({ notebookspath: absdir, depth: 0 });  // depth 0: only files in given dir
            if (mainfiles.length === 0) return undefined;   // no notebook found at given dir
            mainfile = basename(mainfiles[0]);
        }

        const notebook = this.buildNotebookDescriptor(name, mainfile);
        if (!notebook) return undefined;

        if (currentIdx) {
            // Refresh
            this.notebookscache.splice(currentIdx, 1);
        }

        this.notebookscache.push(notebook);

        if (this.onChange) {
            this.onChange(notebook);
        }

        return notebook;
    }

    async refresh({ name, mainfile = undefined }: { name: string, mainfile?: string }) {
        return await this.register({ name, mainfile, refresh: true });
    }

    async renamed(oldname: string, newname: string) {
        const nbindex = this.getNotebookIndexByName(oldname);
        if (nbindex > -1) {
            // remove old name
            this.notebookscache.splice(nbindex, 1);
        }

        return await this.refresh({ name: newname });
    }

    async globAllRecipesMainFiles({ notebookspath, depth }: { notebookspath: string, depth: number }) {
        return await globby(
            notebookspath,
            {
                absolute: true,
                onlyFiles: true,
                deep: depth,
                case: false,
                ignore: ['**/node_modules'],    // in the case not .gitignore is set in the notebook!
                gitignore: true,
                nobrace: true,
                noext: true,
                expandDirectories: {
                    files: this.reciperegistry.getAllRecipesMainFiles(),
                } as any
            }
        );
    }
}
