const fs = require('fs');
const { resolve: resolvePath, basename, dirname, join: pathJoin } = require('path');
const { spawn } = require('child_process');
const glob = require('glob');

module.exports = {
    listNotebooks,
    getFileContent,
    setFileContent,
    execNotebook,
};

function listNotebooks(basepath) {
    return new Promise((resolve, reject) => {

        const resolvedbasepath = resolvePath(basepath);

        glob(resolvedbasepath + '/**/index.js', (err, items) => {
            if (err) return reject(err);

            const res = new Map();

            items
                .map(path => resolvePath(path))
                .filter(abspath => fs.statSync(abspath).isFile())
                .sort((a, b) => a.toLowerCase() < b.toLowerCase() ? -1 : 1)
                .map(abspath => {
                    const absdir = dirname(abspath);
                    const name = absdir.substr(resolvedbasepath.length + 1);
                    res.set(name, {
                        name,
                        absdir,
                        abspath,
                    });
                });

            resolve(res);
        });
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
