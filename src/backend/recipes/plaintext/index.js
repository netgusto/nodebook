const { defaultInitNotebook } = require('../defaultInitNotebook');

const recipe = ({
    key: 'plaintext',
    name: 'Plain text',
    mainfile: ['index.txt', 'main.txt'],
    cmmode: 'plaintext',
    dir: __dirname,
    execLocal: ({ notebook }) => ([
        'cat', notebook.absdir + '/' + notebook.mainfilename,
    ]),
    execDocker: ({ notebook }) => ([
        'docker', 'run', '--rm',
        '-v', notebook.absdir + ':/code',
        'alpine:latest',
        'cat', 'code/' + notebook.mainfilename,
    ]),
    initNotebook: async ({ name, notebookspath }) => await defaultInitNotebook(recipe, notebookspath, name),
});

module.exports = recipe;
