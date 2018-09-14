const { join: pathJoin } = require('path');
const { exec } = require('child_process');
const { lstat } = require('fs');

const { defaultInitNotebook } = require('../defaultInitNotebook');

const stdExec = require('../../stdexec');
const stdExecDocker = require('../../stdexecdocker');

const recipe = ({
    key: 'typescript',
    name: 'TypeScript',
    language: 'TypeScript',
    mainfile: ['index.ts', 'main.ts'],
    cmmode: 'javascript',
    dir: __dirname,
    exec: async ({ notebook, docker, writeStdOut, writeStdErr, writeInfo }) => {

        const tsnode = await hasTsNode(notebook.absdir);

        if (docker) {

            let cmd;

            if (tsnode) {
                cmd = [
                    'sh', '-c', 'node_modules/.bin/ts-node ' + notebook.mainfilename,
                ];
            } else {
                cmd = [
                    'sh', '-c', "tsc --allowJs --outFile /tmp/code.js " + notebook.mainfilename + " && node /tmp/code.js"
                ];
            }

            return stdExecDocker({
                image: 'sandrokeil/typescript',
                cmd,
                cwd: '/app',
                mounts: [
                    { from: notebook.absdir, to: '/app', mode: 'rw' },
                ],
            }, writeStdOut, writeStdErr, writeInfo);

        } else {
            if (tsnode) {
                return stdExec([
                    'sh', '-c', '"' + notebook.absdir + '/node_modules/.bin/ts-node" "' + notebook.abspath + '"',
                ], writeStdOut, writeStdErr, writeInfo);
            } else {
                return stdExec([
                    'sh', '-c', 'tsc --allowJs --outFile /tmp/code.js "' + notebook.abspath + "' && node /tmp/code.js",
                ], writeStdOut, writeStdErr, writeInfo);
            }
        }
    },
    init: async ({ name, notebookspath }) => {
        const copied = await defaultInitNotebook(recipe, notebookspath, name);
        if (!copied) return false;

        const notebookabsdir = pathJoin(notebookspath, name);
        return new Promise(resolve => {
            exec('npm i --silent --audit false --prefer-offline --progress false', { cwd: notebookabsdir }, err => {
                if (err) return resolve(false);
                resolve(true);
            });
        });
    },
});

function hasTsNode(absdir) {
    return new Promise((resolve) => {
        lstat(pathJoin(absdir, 'node_modules/.bin/ts-node'), (err, stats) => {
            resolve(!err && stats.isFile());
        });
    });
}

module.exports = recipe;
