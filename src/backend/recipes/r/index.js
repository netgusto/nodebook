const { defaultInitNotebook } = require('../defaultInitNotebook');

const recipe = ({
    key: 'r',
    name: 'R',
    language: 'R',
    mainfile: ['index.r', 'index.R', 'main.r', 'main.R'],
    cmmode: 'r',
    dir: __dirname,
    execLocal: ({ notebook }) => ([
        'Rscript', notebook.abspath,
    ]),
    execDocker: ({ notebook }) => ([
        'docker', 'run', '--rm',
        '-v', notebook.absdir + ':/code',
        'r-base:latest',
        "Rscript", "/code/" + notebook.mainfilename,
    ]),
    initNotebook: async ({ name, notebookspath }) => await defaultInitNotebook(recipe, notebookspath, name),
});

module.exports = recipe;
