"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const chokidar = require("chokidar");
const path_1 = require("path");
const fs_1 = require("fs");
const globby = require("globby");
class NotebookRegistry {
    constructor(notebookspath, reciperegistry, onChange = undefined) {
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
            const glob = path_1.join(this.notebookspath, '**', '{' + this.reciperegistry.getAllRecipesMainFiles().join(',') + '}');
            this.watcher = chokidar
                .watch(glob, {
                depth: this.depth,
                ignored: [
                    /(^|[\/\\])\../,
                    /(^|[\/\\])node_modules/ // node_modules
                    // TODO: support .gitignore
                ],
                persistent: true,
            })
                .on('ready', () => {
                this.ready = true;
                this.initializeRegistry(this.watcher.getWatched());
                this.watcher
                    .on('add', (path) => this.addFile(path));
                if (this.onChange) {
                    this.watcher.on('change', (path) => this.addFile(path));
                }
                resolve();
            })
                .on('error', error => {
                if (this.ready) {
                    console.error(`Watcher error: ${error}`);
                }
                else {
                    reject(error);
                }
            });
        });
    }
    initializeRegistry(files) {
        const notebookscache = [];
        // identify basepath
        const keys = Object.keys(files);
        for (let i = 0; i < keys.length; i++) {
            const absdir = keys[i];
            const mainfilename = files[absdir][0];
            if (absdir === this.notebookspath)
                continue; // do not list notebook dir as notebook
            const notebookname = this.determineNotebookNameByAbsDir(absdir);
            const notebook = this.buildNotebookDescriptor(notebookname, mainfilename);
            if (notebook)
                notebookscache.push(notebook);
        }
        this.notebookscache = notebookscache;
    }
    determineNotebookNameByAbsDir(absdir) {
        return absdir.substr(this.notebookspath.length + 1);
    }
    buildNotebookDescriptor(notebookname, mainfilename) {
        const recipe = this.reciperegistry.getRecipeForMainFilename(mainfilename);
        if (!recipe)
            return undefined;
        // TODO: improve this
        // Used right now for rust src/main.rs
        const parts = notebookname.split('/');
        if (parts.length > 1 && parts[1] === 'src' && recipe.key === 'rust') {
            mainfilename = parts.slice(1).join('/') + '/' + mainfilename;
            notebookname = parts[0];
        }
        const absdir = path_1.join(this.notebookspath, notebookname);
        const abspath = path_1.join(absdir, mainfilename);
        return {
            name: notebookname,
            mainfilename,
            absdir,
            abspath,
            mtime: fs_1.lstatSync(abspath).mtime.toISOString(),
            recipe,
        };
    }
    unmount() {
        this.watcher.unwatch().close();
    }
    addFile(absfile) {
        return __awaiter(this, void 0, void 0, function* () {
            const absdir = path_1.dirname(absfile);
            const mainfile = path_1.basename(absfile);
            yield this.refresh({
                name: this.determineNotebookNameByAbsDir(absdir),
                mainfile,
            });
        });
    }
    getNotebooks() {
        return this.notebookscache;
    }
    getNotebookByName(name) {
        const index = this.getNotebookIndexByName(name);
        if (index === undefined)
            return undefined;
        return this.notebookscache[index];
    }
    getNotebookIndexByName(name) {
        const notebookIndex = this.notebookscache.findIndex(nb => nb.name === name);
        return notebookIndex > -1 ? notebookIndex : undefined;
    }
    register({ name, mainfile, refresh = false }) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentIdx = this.getNotebookIndexByName(name);
            if (currentIdx !== undefined && !refresh)
                return this.notebookscache[currentIdx];
            const absdir = path_1.join(this.notebookspath, name);
            const exists = yield new Promise(resolve => fs_1.lstat(absdir, err => resolve(!err)));
            if (!exists)
                return undefined;
            if (mainfile === undefined) {
                const mainfiles = yield this.globAllRecipesMainFiles({ notebookspath: absdir, depth: 0 }); // depth 0: only files in given dir
                if (mainfiles.length === 0)
                    return undefined; // no notebook found at given dir
                mainfile = path_1.basename(mainfiles[0]);
            }
            const notebook = this.buildNotebookDescriptor(name, mainfile);
            if (!notebook)
                return undefined;
            if (currentIdx) {
                // Refresh
                this.notebookscache.splice(currentIdx, 1);
            }
            this.notebookscache.push(notebook);
            if (this.onChange) {
                this.onChange(notebook);
            }
            return notebook;
        });
    }
    refresh({ name, mainfile = undefined }) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.register({ name, mainfile, refresh: true });
        });
    }
    renamed(oldname, newname) {
        return __awaiter(this, void 0, void 0, function* () {
            const nbindex = this.getNotebookIndexByName(oldname);
            if (nbindex > -1) {
                // remove old name
                this.notebookscache.splice(nbindex, 1);
            }
            return yield this.refresh({ name: newname });
        });
    }
    globAllRecipesMainFiles({ notebookspath, depth }) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield globby(notebookspath, {
                absolute: true,
                onlyFiles: true,
                deep: depth,
                caseSensitiveMatch: false,
                ignore: ['**/node_modules'],
                gitignore: true,
                braceExpansion: false,
                extglob: true,
                expandDirectories: {
                    files: this.reciperegistry.getAllRecipesMainFiles(),
                }
            });
        });
    }
}
exports.default = NotebookRegistry;
