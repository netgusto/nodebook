const { defaultInitNotebook } = require('../defaultInitNotebook');
const stdExec = require('../../stdexec');
const stdExecDocker = require('../../stdexecdocker');

const recipe = ({
    key: 'lua',
    name: 'Lua',
    language: 'Lua',
    mainfile: ['index.lua', 'main.lua'],
    cmmode: 'lua',
    dir: __dirname,
    exec: ({ notebook, docker, writeStdOut, writeStdErr, writeInfo }) => {

        if (docker) {
            return stdExecDocker({
                image: 'superpaintman/lua:latest',
                cmd: ['lua', '/code/' + notebook.mainfilename,],
                cwd: '/code',
                mounts: [
                    { from: notebook.absdir, to: '/code', mode: 'rw' },
                ],
            }, writeStdOut, writeStdErr, writeInfo);
        } else {
            return stdExec([
                'lua', notebook.absdir + '/' + notebook.mainfilename,
            ]);
        }
    },
    init: async ({ name, notebookspath }) => await defaultInitNotebook(recipe, notebookspath, name),
});

module.exports = recipe;
