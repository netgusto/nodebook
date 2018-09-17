const { stat, lstat, readFile, writeFile, rename: renameDir } = require('fs');
const { resolve: resolvePath, basename, dirname, join: pathJoin } = require('path');
const globby = require('globby');
const dotenv = require('dotenv');

const { getRecipes, getRecipeForMainFilename } = require('./recipes');
const { buildUrl } = require('./buildurl');

module.exports = {
    listNotebooks,
    getFileContent,
    setFileContent,
    execNotebook,
    extractFrontendNotebookSummary,
    extractFrontendRecipeSummary,
    newNotebook,
    sanitizeNotebookName,
    renameNotebook,
};

async function listNotebooks(notebookspath) {
    const resolvedbasepath = resolvePath(notebookspath);

    const items = await globby(
        notebookspath,
        {
            absolute: true,
            onlyFiles: true,
            deep: 2,
            case: false,
            ignore: ['**/node_modules'],    // in the case not .gitignore is set in the notebook!
            gitignore: true,
            nobrace: true,
            noext: true,
            expandDirectories: {
                files: getAllRecipesMainFiles(),
            }
        }
    );

    const notebooks = await Promise.all(items
        .map(async abspath => {

            const mainfilename = basename(abspath);
            const recipe = getRecipeForMainFilename(mainfilename);
            if (!recipe) return undefined;

            const absdir = dirname(abspath);
            const name = absdir.substr(resolvedbasepath.length + 1);

            const stat = await new Promise(resolve => lstat(abspath, function(err, stat) {
                resolve(stat);
            }));

            return {
                name,
                mainfilename,
                absdir,
                abspath,
                recipe,
                mtime: stat.mtime,
            };
        })
    );

    const res = new Map();

    notebooks
        .sort((a, b) => a.abspath.toLowerCase() < b.abspath.toLowerCase() ? -1 : 1)
        .forEach(notebook => res.set(notebook.name, notebook));

    return res;
}

function getFileContent(abspath) {
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

function newNotebook(notebookspath, name, recipe) {
    return recipe.init({ name, notebookspath });
}

async function renameNotebook(notebook, newname) {

    const newabsdir = pathJoin(dirname(notebook.absdir), newname);
    const exists = await new Promise(resolve => lstat(newabsdir, err => resolve(!err)));
    if (exists) {
        throw new Error('Notebook already exists');
    }

    const ok = await new Promise(resolve => 
        renameDir(notebook.absdir, newabsdir, err => resolve(!err))
    );

    if (!ok) throw new Error('Notebook could not be renamed');

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

function getAllRecipesMainFiles() {
    return getRecipes().reduce((carry, recipe) => carry = [...carry, ...recipe.mainfile], []);
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