const { defaultInitNotebook } = require('../defaultInitNotebook');

const recipe = ({
    key: 'go',
    name: 'Go',
    language: 'Go',
    mainfile: ['index.go', 'main.go'],
    cmmode: 'go',
    dir: __dirname,
    execLocal: ({ notebook }) => ([
        'go', 'run', notebook.absdir + '/' + notebook.mainfilename,
    ]),
    execDocker: ({ notebook }) => ([
        'docker', 'run', '--rm',
        '-v', notebook.absdir + ':/code',
        'golang:latest',
        'go', 'run', '/code/' + notebook.mainfilename,
    ]),
    initNotebook: async ({ name, notebookspath }) => await defaultInitNotebook(recipe, notebookspath, name),
});

module.exports = recipe;
