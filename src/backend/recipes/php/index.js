const { defaultInitNotebook } = require('../defaultInitNotebook');
const stdExec = require('../../stdexec');

const recipe = ({
    key: 'php',
    name: 'PHP',
    language: 'PHP',
    mainfile: ['index.php', 'main.php'],
    cmmode: 'php',
    dir: __dirname,
    exec: ({ notebook, docker, writeStdOut, writeStdErr }) => {
        let command;

        if (docker) {
            command = [
                'docker', 'run', '--rm',
                '-v', notebook.absdir + ':/code',
                'php:latest',
                'php', '/code/' + notebook.mainfilename,
            ];
        } else {
            command = [
                'php', notebook.absdir + '/' + notebook.mainfilename,
            ];
        }

        return stdExec(command, writeStdOut, writeStdErr);
    },
    init: async ({ name, notebookspath }) => await defaultInitNotebook(recipe, notebookspath, name),
});

module.exports = recipe;
