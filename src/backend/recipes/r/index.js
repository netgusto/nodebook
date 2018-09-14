const { defaultInitNotebook } = require('../defaultInitNotebook');
const stdExec = require('../../stdexec');

const recipe = ({
    key: 'r',
    name: 'R',
    language: 'R',
    mainfile: ['index.r', 'main.r'],
    cmmode: 'r',
    dir: __dirname,
    exec: ({ notebook, docker, writeStdOut, writeStdErr }) => {
        let command;

        if (docker) {
            command = [
                'docker', 'run', '--rm',
                '-v', notebook.absdir + ':/code',
                'r-base:latest',
                "Rscript", "/code/" + notebook.mainfilename,
            ];
        } else {
            command = [
                'Rscript', notebook.abspath,
            ];
        }

        return stdExec(command, writeStdOut, writeStdErr);
    },
    init: async ({ name, notebookspath }) => await defaultInitNotebook(recipe, notebookspath, name),
});

module.exports = recipe;
