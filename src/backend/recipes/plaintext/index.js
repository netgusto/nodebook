const { defaultInitNotebook } = require('../defaultInitNotebook');
const stdExec = require('../../stdexec');

const recipe = ({
    key: 'plaintext',
    name: 'Plain text',
    mainfile: ['index.txt', 'main.txt'],
    cmmode: 'plaintext',
    dir: __dirname,
    exec: ({ notebook, writeStdOut, writeStdErr, writeInfo, env }) => {
        return stdExec({
            cmd: ['cat', notebook.mainfilename],
            cwd: notebook.absdir,
            env,
        }, writeStdOut, writeStdErr, writeInfo);
        
    },
    init: async ({ name, notebookspath }) => await defaultInitNotebook(recipe, notebookspath, name),
});

module.exports = recipe;
