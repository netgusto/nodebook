const { statSync, lstat, readFile, writeFile, rename: renameDir } = require('fs');
const { resolve: resolvePath, basename, dirname, join: pathJoin } = require('path');
const { spawn } = require('child_process');
const globby = require('globby');

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

    const res = new Map();

    items
        .sort((a, b) => a.toLowerCase() < b.toLowerCase() ? -1 : 1)
        .map(abspath => {

            const mainfilename = basename(abspath);
            const recipe = getRecipeForMainFilename(mainfilename);
            if (!recipe) return undefined;

            const absdir = dirname(abspath);
            const name = absdir.substr(resolvedbasepath.length + 1);            

            res.set(name, {
                name,
                mainfilename,
                absdir,
                abspath,
                recipe,
            });
        })
        .filter(v => !!v);

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

function execNotebook(notebook, execCommand, res) {
    return new Promise(async (resolve, _) => {
        
        const command = await execCommand({ notebook });
        const child = spawn(command[0], command.slice(1));

        child.on('error', function (err) {
            res.write(JSON.stringify({ chan: 'stderr', data: JSON.stringify(err.message + "\n") }) + '\n');
        });

        child.stdout.on('data', (chunk) => {
            res.write(JSON.stringify({ chan: 'stdout', data: JSON.stringify(chunk.toString('utf-8')) }) + '\n');
        });

        child.stderr.on('data', (chunk) => {
            res.write(JSON.stringify({ chan: 'stderr', data: JSON.stringify(chunk.toString('utf-8')) }) + '\n');
        });

        child.on('close', (code) => {
            if (code !== 0) {
                res.write(JSON.stringify({ chan: 'stderr', data: JSON.stringify("Process exited with status code " + code + "\n") }) + '\n');
            }

            resolve();
        });
    });
}

async function newNotebook(notebookspath, name, recipe) {
    return await recipe.initNotebook({ name, notebookspath });
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