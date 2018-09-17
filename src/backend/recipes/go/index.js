const { defaultInitNotebook } = require('../defaultInitNotebook');
const stdExec = require('../../stdexec');
const stdExecDocker = require('../../stdexecdocker');

const recipe = ({
    key: 'go',
    name: 'Go',
    language: 'Go',
    mainfile: ['index.go', 'main.go'],
    cmmode: 'go',
    dir: __dirname,
    exec: ({ notebook, docker, writeStdOut, writeStdErr, writeInfo, env }) => {
        if (docker) {
            return stdExecDocker({
                image: 'golang:latest',
                cmd: ['go', 'run', '/code/' + notebook.mainfilename,],
                cwd: '/code',
                mounts: [
                    { from: notebook.absdir, to: '/code', mode: 'rw' },
                ],
                env,
            }, writeStdOut, writeStdErr, writeInfo);
        } else {
            return stdExec({
                cmd: ['go', 'run', notebook.mainfilename],
                cwd: notebook.absdir,
                env,
            }, writeStdOut, writeStdErr, writeInfo);
        }
    },
    init: async ({ name, notebookspath }) => await defaultInitNotebook(recipe, notebookspath, name),
});

module.exports = recipe;
