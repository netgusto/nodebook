const { defaultInitNotebook } = require('../defaultInitNotebook');
const stdExec = require('../../stdexec');
const stdExecDocker = require('../../stdexecdocker');

const recipe = ({
    key: 'java',
    name: 'Java',
    language: 'Java',
    mainfile: ['index.java', 'main.java'],
    cmmode: 'clike',
    dir: __dirname,
    exec: ({ notebook, docker, writeStdOut, writeStdErr, writeInfo }) => {

        if (docker) {
            return stdExecDocker({
                image: 'java:latest',
                cmd: ['sh', '-c', 'javac -d /tmp "/code/' + notebook.mainfilename + '" && cd /tmp && java Main'],
                cwd: '/code',
                mounts: [
                    { from: notebook.absdir, to: '/code', mode: 'rw' },
                ],
            }, writeStdOut, writeStdErr, writeInfo);
        } else {
            return stdExec([
                'sh', '-c', 'javac -d /tmp "' + notebook.absdir + '/' + notebook.mainfilename + '" && cd /tmp && java Main',
            ]);
        }
    },
    init: async ({ name, notebookspath }) => await defaultInitNotebook(recipe, notebookspath, name),
});

module.exports = recipe;