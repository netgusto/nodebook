const { join: pathJoin } = require('path');
const { exec } = require('child_process');
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
    exec: ({ notebook, docker, writeStdOut, writeStdErr, writeInfo }) => {
        if (docker) {
            return stdExecDocker({
                image: 'sandrokeil/typescript',
                cmd: ['sh', '-c', 'node_modules/.bin/ts-node index.ts'],
                cwd: '/app',
                mounts: [
                    { from: notebook.absdir, to: '/app', mode: 'rw' },
                ],
            }, writeStdOut, writeStdErr, writeInfo);
        } else {
            return stdExec([
                'sh', '-c', 'cd "' + notebook.absdir + '" && node_modules/.bin/ts-node index.ts',
            ], writeStdOut, writeStdErr, writeInfo);
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

module.exports = recipe;
