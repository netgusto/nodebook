const fs = require('fs');
const { resolve: resolvePath, basename, dirname, join: pathJoin } = require('path');
const { spawn } = require('child_process');
const globby = require('globby');

const { getGlobFileMatchingPatterns, getRecipeForMainFilename } = require('./recipes');

module.exports = {
    listNotebooks,
    getFileContent,
    setFileContent,
    execNotebook,
};

function listNotebooks(basepath) {
    const resolvedbasepath = resolvePath(basepath);

    return globby(getGlobFileMatchingPatterns(basepath), { gitignore: true })
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
    return new Promise((resolve, _) => {
        
        const command = execCommand({ notebook });
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
