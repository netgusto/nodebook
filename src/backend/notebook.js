const fs = require('fs');
const { resolve: resolvePath, basename, dirname } = require('path');
const { spawn } = require('child_process');
const globby = require('globby');

const { getGlobFileMatchingPatterns, getRecipeForMainFilename } = require('./recipes');
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
};

function listNotebooks(notebookspath) {
    const resolvedbasepath = resolvePath(notebookspath);

    return globby(getGlobFileMatchingPatterns(notebookspath), { gitignore: true })
        .then(items => {
            const res = new Map();

            items
                .map(path => resolvePath(path))
                .filter(abspath => fs.statSync(abspath).isFile())
                .sort((a, b) => a.toLowerCase() < b.toLowerCase() ? -1 : 1)
                .map(abspath => {
                    const absdir = dirname(abspath);
                    const mainfilename = basename(abspath);
                    const name = absdir.substr(resolvedbasepath.length + 1);
                    const recipe = getRecipeForMainFilename(mainfilename);

                    res.set(name, {
                        name,
                        mainfilename,
                        absdir,
                        abspath,
                        recipe,
                    });
                });

            return res;
        });
}

function getFileContent(abspath) {
    return new Promise((resolve, reject) => {
        fs.readFile(abspath, 'utf8', function (err, contents) {
            if (err) return reject(err);
            resolve(contents);
        });
    });
}

function setFileContent(abspath, content) {
    return new Promise((resolve, reject) => {
        fs.writeFile(abspath, content, 'utf8', function (err) {
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

async function newNotebook(notebookspath, name, recipe, defaultcontentsdir) {
    return await recipe.initNotebook({ name, notebookspath, defaultcontentsdir });
}

function sanitizeNotebookName(name) {
    if (typeof name !== 'string') throw new Error('The notebook name should be a string');
    
    name = name.
        replace(/\s/g, ' ').
        replace(/\.{2,}/g, '.').
        replace(/[^a-zA-Z0-9\u00C0-\u017F\s+-_\.]/g, '').
        trim();
    
    if (name === '' || name === '.') throw new Error('Invalid name');

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