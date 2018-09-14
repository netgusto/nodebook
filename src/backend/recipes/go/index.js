const { defaultInitNotebook } = require('../defaultInitNotebook');
const stdExec = require('../../stdexec');

const recipe = ({
    key: 'go',
    name: 'Go',
    language: 'Go',
    mainfile: ['index.go', 'main.go'],
    cmmode: 'go',
    dir: __dirname,
    exec: ({ notebook, docker, writeStdOut, writeStdErr }) => {
        let command;

        if (docker) {
            command = [
                'docker', 'run', '--rm',
                '-v', notebook.absdir + ':/code',
                'golang:latest',
                'go', 'run', '/code/' + notebook.mainfilename,
            ];
        } else {
            command = [
                'go', 'run', notebook.absdir + '/' + notebook.mainfilename,
            ];
        }

        return stdExec(command, writeStdOut, writeStdErr);
    },
    init: async ({ name, notebookspath }) => await defaultInitNotebook(recipe, notebookspath, name),
});

module.exports = recipe;
