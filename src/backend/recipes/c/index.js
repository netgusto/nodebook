const { defaultInitNotebook } = require('../defaultInitNotebook');
const stdExec = require('../../stdexec');
const stdExecDocker = require('../../stdexecdocker');

const recipe = ({
    key: 'c',
    name: 'C11',
    language: 'C',
    mainfile: ['index.c', 'main.c'],
    cmmode: 'clike',
    dir: __dirname,
    exec: ({ notebook, docker, writeStdOut, writeStdErr, writeInfo, env }) => {
        let command;

        if (docker) {
            return stdExecDocker({
                image: 'gcc:latest',
                cmd: ['sh', '-c', "gcc -Wall -o /tmp/code.out /code/" + notebook.mainfilename + " && /tmp/code.out"],
                cwd: '/code',
                mounts: [
                    { from: notebook.absdir, to: '/code', mode: 'rw' },
                ],
                env,
            }, writeStdOut, writeStdErr, writeInfo);
        } else {
            return stdExec({
                cmd: ['sh', '-c', "gcc -Wall -o /tmp/code.out '" + notebook.mainfilename + "' && /tmp/code.out"],
                cwd: notebook.absdir,
                env,
            }, writeStdOut, writeStdErr, writeInfo);
        }
    },
    init: async ({ name, notebookspath }) => await defaultInitNotebook(recipe, notebookspath, name),
});

module.exports = recipe;