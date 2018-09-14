const { join: pathJoin } = require('path');
const { exec } = require('child_process');
const { defaultInitNotebook } = require('../defaultInitNotebook');

const stdExec = require('../../stdexec');

const recipe = ({
    key: 'typescript',
    name: 'TypeScript',
    language: 'TypeScript',
    mainfile: ['index.ts', 'main.ts'],
    cmmode: 'javascript',
    dir: __dirname,
    exec: ({ notebook, docker, writeStdOut, writeStdErr }) => {
        let command;

        if (docker) {
            command = [
                'docker', 'run', '--rm',
                '-v', notebook.absdir + ':/app',
                'sandrokeil/typescript',
                'sh', '-c', 'node_modules/.bin/ts-node index.ts',
            ];
        } else {
            command = [
                'sh', '-c', 'cd "' + notebook.absdir + '" && node_modules/.bin/ts-node index.ts',
            ];
        }

        return stdExec(command, writeStdOut, writeStdErr);
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
