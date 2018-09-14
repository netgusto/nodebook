const { defaultInitNotebook } = require('../defaultInitNotebook');
const stdExec = require('../../stdexec');
const stdExecDocker = require('../../stdexecdocker');

const recipe = ({
    key: 'haskell',
    name: 'Haskell',
    language: 'Haskell',
    mainfile: ['index.hs', 'main.hs'],
    cmmode: 'haskell',
    dir: __dirname,
    exec: ({ notebook, docker, writeStdOut, writeStdErr, writeInfo }) => {

        if (docker) {
            return stdExecDocker({
                image: 'haskell:latest',
                cmd: ['sh', '-c', 'ghc -v0 -H14m -outputdir /tmp -o /tmp/code "/code/' + notebook.mainfilename + '" && /tmp/code',],
                cwd: '/code',
                mounts: [
                    { from: notebook.absdir, to: '/code', mode: 'rw' },
                ],
            }, writeStdOut, writeStdErr, writeInfo);
        } else {
            return stdExec([
                'bash', '-c', 'ghc -v0 -H14m -outputdir /tmp -o /tmp/code ' + notebook.absdir + '/' + notebook.mainfilename + ' && /tmp/code',
            ], writeStdOut, writeStdErr, writeInfo);
        }
    },
    init: async ({ name, notebookspath }) => await defaultInitNotebook(recipe, notebookspath, name),
});

module.exports = recipe;
