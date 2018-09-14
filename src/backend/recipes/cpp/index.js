const { defaultInitNotebook } = require('../defaultInitNotebook');
const stdExec = require('../../stdexec');

const recipe = ({
    key: 'cpp',
    name: 'C++14',
    language: 'C++',
    mainfile: ['index.cpp', 'main.cpp'],
    cmmode: 'clike',
    dir: __dirname,
    exec: ({ notebook, docker, writeStdOut, writeStdErr }) => {
        let command;

        if (docker) {
            command = [
                'docker', 'run', '--rm',
                '-v', notebook.absdir + ':/code',
                'gcc:latest',
                'sh', '-c', "g++ -std=c++14 -Wall -o /tmp/code.out /code/" + notebook.mainfilename + " && /tmp/code.out"
            ];
        } else {
            command = [
                'sh', '-c', "g++ -std=c++14 -Wall -o /tmp/code.out '" + notebook.abspath + "' && /tmp/code.out"
            ];
        }

        return stdExec(command, writeStdOut, writeStdErr);
    },
    init: async ({ name, notebookspath }) => await defaultInitNotebook(recipe, notebookspath, name),
});

module.exports = recipe;