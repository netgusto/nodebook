"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const dotenv = require("dotenv");
const buildurl_1 = require("./buildurl");
function listNotebooks({ notebookregistry }) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = new Map();
        notebookregistry
            .getNotebooks()
            .filter(notebook => notebook !== undefined)
            .sort((a, b) => a.abspath.toLowerCase() < b.abspath.toLowerCase() ? -1 : 1)
            .forEach(notebook => res.set(notebook.name, notebook));
        return res;
    });
}
exports.listNotebooks = listNotebooks;
function getFileContent(abspath) {
    return new Promise((resolve, reject) => {
        fs_1.readFile(abspath, 'utf8', function (err, contents) {
            if (err)
                return reject(err);
            resolve(contents);
        });
    });
}
exports.getFileContent = getFileContent;
function setFileContent(abspath, content) {
    return new Promise((resolve, reject) => {
        fs_1.writeFile(abspath, content, 'utf8', function (err) {
            if (err)
                reject(err);
            resolve();
        });
    });
}
function updateNotebookContent(notebook, content, notebookregistry) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield setFileContent(notebook.abspath, content);
        }
        catch (e) {
            console.log(e);
            return false;
        }
        return yield notebookregistry.refresh({ name: notebook.name, mainfile: notebook.mainfilename });
    });
}
exports.updateNotebookContent = updateNotebookContent;
function execNotebook(notebook, docker, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const write = (data, chan) => res.writable && !res.finished && res.write(JSON.stringify({ chan, data: JSON.stringify(data) }) + '\n');
        const writeStdOut = (data) => write(data, 'stdout');
        const writeStdErr = (data) => write(data, 'stderr');
        const writeInfo = (data) => write(data, 'info');
        // extracting .env from notebook if defined
        const env = yield getNotebookEnv(notebook);
        const { start, stop } = yield notebook.recipe.exec({
            notebook,
            docker,
            writeStdOut,
            writeStdErr,
            writeInfo,
            env,
        });
        return { start, stop };
    });
}
exports.execNotebook = execNotebook;
function newNotebook(notebookspath, name, recipe, notebookregistry) {
    return __awaiter(this, void 0, void 0, function* () {
        const success = yield recipe.init({ notebookspath, name });
        if (success) {
            // update cache
            const notebook = yield notebookregistry.register({ name });
            if (!notebook) {
                return false;
            }
        }
        return success;
    });
}
exports.newNotebook = newNotebook;
function renameNotebook(notebook, newname, notebookregistry) {
    return __awaiter(this, void 0, void 0, function* () {
        const newabsdir = path_1.join(path_1.dirname(notebook.absdir), newname);
        const exists = yield new Promise(resolve => fs_1.lstat(newabsdir, err => resolve(!err)));
        if (exists) {
            throw new Error('Notebook already exists');
        }
        const ok = yield new Promise(resolve => fs_1.rename(notebook.absdir, newabsdir, err => resolve(!err)));
        if (!ok)
            return false;
        const renamedNotebook = yield notebookregistry.renamed(notebook.name, newname);
        if (!renamedNotebook)
            return false;
        return true;
    });
}
exports.renameNotebook = renameNotebook;
function sanitizeNotebookName(name) {
    if (typeof name !== 'string')
        throw new Error('The notebook name should be a string');
    name = name.
        replace(/\.{2,}/g, '.').
        replace(/\\/g, '_').
        replace(/\//g, '_').
        replace(/[^a-zA-Z0-9àâäéèëêìïîùûüÿŷ\s-_\.]/g, '').
        replace(/\s+/g, ' ').
        trim();
    if (name === '' || name[0] === '.')
        throw new Error('Invalid name');
    return name;
}
exports.sanitizeNotebookName = sanitizeNotebookName;
function extractFrontendNotebookSummary(notebook) {
    return {
        name: notebook.name,
        url: buildurl_1.buildUrl("notebook", { name: notebook.name }),
        mtime: notebook.mtime,
        recipe: extractFrontendRecipeSummary(notebook.recipe),
    };
}
exports.extractFrontendNotebookSummary = extractFrontendNotebookSummary;
function extractFrontendRecipeSummary(recipe) {
    return {
        key: recipe.key,
        name: recipe.name,
        language: recipe.language,
        cmmode: recipe.cmmode,
    };
}
exports.extractFrontendRecipeSummary = extractFrontendRecipeSummary;
function getNotebookEnv(notebook) {
    return __awaiter(this, void 0, void 0, function* () {
        const abspath = path_1.join(notebook.absdir, '.env');
        const exists = yield new Promise(resolve => fs_1.stat(abspath, function (err, stat) {
            resolve(!err && stat.isFile());
        }));
        if (!exists)
            return {};
        const dotenvcontent = yield getFileContent(abspath);
        return yield dotenv.parse(dotenvcontent);
    });
}
