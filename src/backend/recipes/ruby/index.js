const { defaultInitNotebook } = require('../defaultInitNotebook');
const stdExec = require('../../stdexec');
const stdExecDocker = require('../../stdexecdocker');

const recipe = ({
    key: 'ruby',
    name: 'Ruby',
    language: 'Ruby',
    mainfile: ['index.rb', 'main.rb'],
    cmmode: 'ruby',
    dir: __dirname,
    exec: ({ notebook, docker, writeStdOut, writeStdErr, writeInfo }) => {

        if (docker) {
            return stdExecDocker({
                image: 'ruby:latest',
                cmd: ['ruby', '/code/' + notebook.mainfilename,],
                cwd: '/code',
                mounts: [
                    { from: notebook.absdir, to: '/code', mode: 'rw' },
                ],
            }, writeStdOut, writeStdErr, writeInfo);
        } else {
            return stdExec([
                'ruby', notebook.absdir + '/' + notebook.mainfilename,
            ], writeStdOut, writeStdErr, writeInfo);
        }
    },
    init: async ({ name, notebookspath }) => await defaultInitNotebook(recipe, notebookspath, name),
});

module.exports = recipe;
