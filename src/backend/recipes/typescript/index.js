const { join: pathJoin } = require('path');
const { exec } = require('child_process');
const { defaultInitNotebook } = require('../defaultInitNotebook');

const recipe = ({
    key: 'typescript',
    name: 'TypeScript',
    language: 'TypeScript',
    mainfile: ['index.ts', 'main.ts'],
    cmmode: 'javascript',
    dir: __dirname,
    execLocal: ({ notebook }) => ([
        'sh', '-c', 'cd "' + notebook.absdir + '" && node_modules/.bin/ts-node index.ts',
    ]),
    execDocker: ({ notebook }) => ([
        'docker', 'run', '--rm',
        '-v', notebook.absdir + ':/app',
        'sandrokeil/typescript',
        'sh', '-c', 'node_modules/.bin/ts-node index.ts',
    ]),
    initNotebook: async ({ name, notebookspath }) => {
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
