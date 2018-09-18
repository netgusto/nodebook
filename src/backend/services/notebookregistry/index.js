const chokidar = require('chokidar');
const { join: pathJoin, dirname, basename } = require('path');
const { lstat, lstatSync } = require('fs');
const globby = require('globby');

module.exports = class NotebookRegistry {

    constructor(notebookspath, reciperegistry) {
        this.notebookspath = notebookspath;
        this.depth = 1;
        this.watcher = undefined;
        this.ready = false;
        this.reciperegistry = reciperegistry;

        this.notebookscache = [];
    }

    mount() {
        return new Promise((resolve, reject) => {

            // const glob = this.reciperegistry.getAllRecipesMainFiles().map(mainfile => pathJoin(this.notebookspath, '**', mainfile));
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
                        .on('add', path => this.addFile(path))
                        .on('unlinkDir', path => this.unlinkDir(path));

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

    initializeRegistry(files) {

        const notebookscache = [];

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

    determineNotebookNameByAbsDir(absdir) {
        return absdir.substr(this.notebookspath.length + 1);
    }

    buildNotebookDescriptor(notebookname, mainfilename) {

        const recipe = this.reciperegistry.getRecipeForMainFilename(mainfilename);
        if (!recipe) return undefined;

        const absdir = pathJoin(this.notebookspath, notebookname);
        const abspath = pathJoin(absdir, mainfilename)
    
        return {
            name: notebookname,
            mainfilename,
            absdir,
            abspath,
            mtime: lstatSync(abspath).mtime,
            recipe,
        };
    }

    unmount() {
        this.watcher.unwatch().close();
    }

    async addFile(absfile) {
        const absdir = dirname(absfile);
        const mainfile = basename(absfile);
        await this.refresh({
            name: this.determineNotebookNameByAbsDir(absdir),
            mainfile,
        });
    }

    unlinkDir(path) {
        console.log('unlinkDir', path);
    }

    getNotebooks() {
        return this.notebookscache;
    }

    getNotebookByName(name) {
        const index = this.getNotebookIndexByName(name);
        if (index === undefined) return undefined;

        return this.notebookscache[index];
    }

    getNotebookIndexByName(name) {
        const notebookIndex = this.notebookscache.findIndex(nb => nb.name === name);
        return notebookIndex > -1 ? notebookIndex : undefined;
    }

    async register({ name, mainfile = undefined, refresh = false }) {

        const currentIdx = this.getNotebookIndexByName(name);
        if (currentIdx !== undefined && !refresh) return this.notebookscache[currentIdx];

        const absdir = pathJoin(this.notebookspath, name);
        const exists = await new Promise(resolve => lstat(absdir, err => resolve(!err)));
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

        return notebook;
    }

    async refresh({ name, mainfile }) {
        return await this.register({ name, mainfile, refresh: true });
    }

    async renamed(oldname, newname) {
        const nbindex = this.getNotebookIndexByName(oldname);
        if (nbindex > -1) {
            // remove old name
            this.notebookscache.splice(nbindex, 1);
        }

        return await this.refresh({ name: newname });
    }

    async globAllRecipesMainFiles({ notebookspath, depth }) {
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
                }
            }
        );
    }
}
