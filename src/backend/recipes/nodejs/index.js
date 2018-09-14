const { defaultInitNotebook } = require('../defaultInitNotebook');
const stdExec = require('../../stdexec');
const stdExecDocker = require('../../stdexecdocker');

const recipe = ({
    key: 'nodejs',
    name: 'NodeJS',
    language: 'JavaScript',
    mainfile: ['index.js', 'main.js'],
    cmmode: 'javascript',
    dir: __dirname,
    exec: ({ notebook, docker, writeStdOut, writeStdErr }) => {
        let command;

        if (docker) {
            return stdExecDocker([
                'docker', 'run', '--rm',
                '-v', notebook.absdir + ':/code',
                'node:alpine',
                'node', '--harmony', '/code/' + notebook.mainfilename,
            ], writeStdOut, writeStdErr);
        } else {
            return stdExec([
                'node', '--harmony', notebook.absdir + '/' + notebook.mainfilename,
            ], writeStdOut, writeStdErr);
        }
    },
    init: async ({ name, notebookspath }) => await defaultInitNotebook(recipe, notebookspath, name),
});

module.exports = recipe;
