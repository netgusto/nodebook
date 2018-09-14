const { defaultInitNotebook } = require('../defaultInitNotebook');
const stdExec = require('../../stdexec');

const recipe = ({
    key: 'c',
    name: 'C11',
    language: 'C',
    mainfile: ['index.c', 'main.c'],
    cmmode: 'clike',
    dir: __dirname,
    exec: ({ notebook, docker, writeStdOut, writeStdErr }) => {
        let command;

        if (docker) {
            command = [
                'docker', 'run', '--rm',
                '-v', notebook.absdir + ':/code',
                'gcc:latest',
                'sh', '-c', "gcc -Wall -o /tmp/code.out /code/" + notebook.mainfilename + " && /tmp/code.out"
            ];
        } else {
            command = [
                'sh', '-c', "gcc -Wall -o /tmp/code.out '" + notebook.abspath + "' && /tmp/code.out"
            ];
        }

        return stdExec(command, writeStdOut, writeStdErr);
    },
    init: async ({ name, notebookspath }) => await defaultInitNotebook(recipe, notebookspath, name),
});

module.exports = recipe;