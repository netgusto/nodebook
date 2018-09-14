const { defaultInitNotebook } = require('../defaultInitNotebook');
const stdExec = require('../../stdexec');

const recipe = ({
    key: 'python3',
    name: 'Python 3',
    language: 'Python',
    mainfile: ['index.py', 'main.py'],
    cmmode: 'python',
    dir: __dirname,
    exec: ({ notebook, docker, writeStdOut, writeStdErr }) => {
        let command;

        if (docker) {
            command = [
                'docker', 'run', '--rm',
                '-v', notebook.absdir + ':/code',
                'python:3',
                'python', '/code/' + notebook.mainfilename,
            ];
        } else {
            command = [
                'python', notebook.absdir + '/' + notebook.mainfilename,
            ];
        }

        return stdExec(command, writeStdOut, writeStdErr);
    },
    init: async ({ name, notebookspath }) => await defaultInitNotebook(recipe, notebookspath, name),
});

module.exports = recipe;
