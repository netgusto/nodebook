const { defaultInitNotebook } = require('../defaultInitNotebook');
const stdExec = require('../../stdexec');

const recipe = ({
    key: 'swift',
    name: 'Swift',
    language: 'Swift',
    mainfile: ['index.swift', 'main.swift'],
    cmmode: 'swift',
    dir: __dirname,
    exec: ({ notebook, docker, writeStdOut, writeStdErr }) => {
        let command;

        if (docker) {
            command = [
                'docker', 'run', '--rm',
                '-v', notebook.absdir + ':/code',
                'swift:latest',
                "swift", "/code/" + notebook.mainfilename,
            ];
        } else {
            command = [
                'swift', notebook.abspath,
            ];
        }

        return stdExec(command, writeStdOut, writeStdErr);
    },
    init: async ({ name, notebookspath }) => await defaultInitNotebook(recipe, notebookspath, name),
});

module.exports = recipe;
