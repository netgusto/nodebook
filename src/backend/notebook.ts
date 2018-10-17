import { stat, lstat, readFile, writeFile, rename as renameDir } from 'fs';
import { dirname, join as pathJoin } from 'path';
import * as dotenv from 'dotenv';

import { buildUrl } from './buildurl';

export {
    listNotebooks,
    getFileContent,
    updateNotebookContent,
    execNotebook,
    extractFrontendNotebookSummary,
    extractFrontendRecipeSummary,
    newNotebook,
    sanitizeNotebookName,
    renameNotebook,
};

async function listNotebooks({ notebookregistry }) {

    const res = new Map();

    notebookregistry
        .getNotebooks()
        .filter(notebook => notebook !== undefined)
        .sort((a, b) => a.abspath.toLowerCase() < b.abspath.toLowerCase() ? -1 : 1)
        .forEach(notebook => res.set(notebook.name, notebook));

    return res;
}

function getFileContent(abspath): Promise<string> {
    return new Promise((resolve, reject) => {
        readFile(abspath, 'utf8', function (err, contents) {
            if (err) return reject(err);
            resolve(contents);
        });
    });
}

function setFileContent(abspath, content) {
    return new Promise((resolve, reject) => {
        writeFile(abspath, content, 'utf8', function (err) {
            if (err) reject(err);
            resolve();
        });
    });
}

async function updateNotebookContent(notebook, content, notebookregistry) {
    try {
        await setFileContent(notebook.abspath, content);
    } catch(e) {
        console.log(e);
        return false;
    }

    return await notebookregistry.refresh({ name: notebook.name, mainfile: notebook.mainfilename });
}

async function execNotebook(notebook, docker, res) {
    const write = (data, chan) => res.writable && !res.finished && res.write(JSON.stringify({ chan, data: JSON.stringify(data) }) + '\n');
    const writeStdOut = data => write(data, 'stdout');
    const writeStdErr = data => write(data, 'stderr');
    const writeInfo = data => write(data, 'info');

    // extracting .env from notebook if defined
    const env = await getNotebookEnv(notebook);

    const { start, stop } = await notebook.recipe.exec({
        notebook,
        docker,
        writeStdOut,
        writeStdErr,
        writeInfo,
        env,
    });
    return { start, stop };
}

async function newNotebook(notebookspath, name, recipe, notebookregistry) {
    const success = await recipe.init({ notebookspath, name });
    if (success) {
        // update cache
        const notebook = await notebookregistry.register({ name });
        if (!notebook) {
            return false;
        }
    }

    return success;
}

async function renameNotebook(notebook, newname, notebookregistry) {

    const newabsdir = pathJoin(dirname(notebook.absdir), newname);
    const exists = await new Promise(resolve => lstat(newabsdir, err => resolve(!err)));
    if (exists) {
        throw new Error('Notebook already exists');
    }

    const ok = await new Promise(resolve => 
        renameDir(notebook.absdir, newabsdir, err => resolve(!err))
    );

    if (!ok) return false;

    const renamedNotebook = await notebookregistry.renamed(notebook.name, newname);
    if (!renamedNotebook) return false;

    return true;
}

function sanitizeNotebookName(name) {
    if (typeof name !== 'string') throw new Error('The notebook name should be a string');
    
    name = name.
        replace(/\.{2,}/g, '.').
        replace(/\\/g, '_').
        replace(/\//g, '_').
        replace(/[^a-zA-Z0-9àâäéèëêìïîùûüÿŷ\s-_\.]/g, '').
        replace(/\s+/g, ' ').
        trim();
    
    if (name === '' || name[0] === '.') throw new Error('Invalid name');

    return name;
}

function extractFrontendNotebookSummary(notebook) {
    return {
        name: notebook.name,
        url: buildUrl("notebook", { name: notebook.name }),
        mtime: notebook.mtime,
        recipe: extractFrontendRecipeSummary(notebook.recipe),
    };
}

function extractFrontendRecipeSummary(recipe) {
    return {
        key: recipe.key,
        name: recipe.name,
        language: recipe.language,
        cmmode: recipe.cmmode,
    };
}

async function getNotebookEnv(notebook) {
    const abspath = pathJoin(notebook.absdir, '.env');
    const exists = await new Promise(resolve => stat(abspath, function (err, stat) {
        resolve(!err && stat.isFile());
    }));

    if (!exists) return {};

    const dotenvcontent = await getFileContent(abspath);
    return await dotenv.parse(dotenvcontent);
}