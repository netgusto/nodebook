const { defaultInitNotebook } = require('../defaultInitNotebook');
const stdExec = require('../../stdexec');

const recipe = ({
    key: 'haskell',
    name: 'Haskell',
    language: 'Haskell',
    mainfile: ['index.hs', 'main.hs'],
    cmmode: 'haskell',
    dir: __dirname,
    exec: ({ notebook, docker, writeStdOut, writeStdErr }) => {
        let command;

        if (docker) {
            command = [
                'docker', 'run', '--rm',
                '-v', notebook.absdir + ':/code',
                'haskell:latest',
                'sh', '-c', 'ghc -v0 -H14m -outputdir /tmp -o /tmp/code "/code/' + notebook.mainfilename + '" && /tmp/code',
            ];
        } else {
            command = [
                'bash', '-c', 'ghc -v0 -H14m -outputdir /tmp -o /tmp/code ' + notebook.absdir + '/' + notebook.mainfilename + ' && /tmp/code',
            ];
        }

        return stdExec(command, writeStdOut, writeStdErr);
    },
    init: async ({ name, notebookspath }) => await defaultInitNotebook(recipe, notebookspath, name),
});

module.exports = recipe;
