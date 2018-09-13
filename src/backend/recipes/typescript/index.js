const { lstat } = require('fs');
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
    execLocal: async ({ notebook }) => {

        let cmd;
        if (await hasTsNode(notebook.absdir)) {
            cmd = [
                'sh', '-c', '"' + notebook.absdir + '/node_modules/.bin/ts-node" "' + notebook.abspath + '"',
            ];
        } else {
            cmd = [
                'sh', '-c', 'tsc --allowJs --outFile /tmp/code.js "' + notebook.abspath + "' && node /tmp/code.js",
            ];
        }

        return cmd;
    },
    execDocker: async ({ notebook }) => {

        let cmd;

        if (await hasTsNode(notebook.absdir)) {
            cmd = [
                'sh', '-c', 'node_modules/.bin/ts-node index.ts'
            ];
        } else {
            cmd = [
                'sh', '-c', "tsc --allowJs --outFile /tmp/code.js /app/" + notebook.mainfilename + " && node /tmp/code.js"
            ];
        }

        return [
            'docker', 'run', '--rm',
            '-v', notebook.absdir + ':/app',
            'sandrokeil/typescript',
            ...cmd,
        ];
    },
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

function hasTsNode(absdir) {
    return new Promise((resolve) => {
        lstat(pathJoin(absdir, 'node_modules', '.bin', 'ts-node'), (err, stats) => {
            resolve(!err && (stats.isFile() || stats.isSymbolicLink()));
        });
    });
}