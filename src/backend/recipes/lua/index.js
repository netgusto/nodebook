const { defaultInitNotebook } = require('../defaultInitNotebook');
const stdExec = require('../../stdexec');

const recipe = ({
    key: 'lua',
    name: 'Lua',
    language: 'Lua',
    mainfile: ['index.lua', 'main.lua'],
    cmmode: 'lua',
    dir: __dirname,
    exec: ({ notebook, docker, writeStdOut, writeStdErr }) => {
        let command;

        if (docker) {
            command = [
                'docker', 'run', '--rm',
                '-v', notebook.absdir + ':/code',
                'superpaintman/lua:latest',
                'lua', '/code/' + notebook.mainfilename,
            ];
        } else {
            command = [
                'lua', notebook.absdir + '/' + notebook.mainfilename,
            ];
        }

        return stdExec(command, writeStdOut, writeStdErr);
    },
    init: async ({ name, notebookspath }) => await defaultInitNotebook(recipe, notebookspath, name),
});

module.exports = recipe;
