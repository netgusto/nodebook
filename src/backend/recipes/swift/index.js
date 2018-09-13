const { defaultInitNotebook } = require('../defaultInitNotebook');

const recipe = ({
    key: 'swift',
    name: 'Swift',
    language: 'Swift',
    mainfile: ['index.swift', 'main.swift'],
    cmmode: 'swift',
    dir: __dirname,
    execLocal: ({ notebook }) => ([
        'swift', notebook.abspath,
    ]),
    execDocker: ({ notebook }) => ([
        'docker', 'run', '--rm',
        '-v', notebook.absdir + ':/code',
        'swift:latest',
        "swift", "/code/" + notebook.mainfilename,
    ]),
    initNotebook: async ({ name, notebookspath }) => await defaultInitNotebook(recipe, notebookspath, name),
});

module.exports = recipe;
