const { defaultInitNotebook } = require('../defaultInitNotebook');

const recipe = ({
    key: 'nodejs',
    name: 'NodeJS',
    language: 'JavaScript',
    mainfile: ['index.js', 'main.js'],
    cmmode: 'javascript',
    dir: __dirname,
    execLocal: ({ notebook }) => ([
        'node', '--harmony', notebook.absdir + '/' + notebook.mainfilename,
    ]),
    execDocker: ({ notebook }) => ([
        'docker', 'run', '--rm',
        '-v', notebook.absdir + ':/code',
        'node:alpine',
        'node', '/code/' + notebook.mainfilename,
    ]),
    initNotebook: async ({ name, notebookspath }) => await defaultInitNotebook(recipe, notebookspath, name),
});

module.exports = recipe;
