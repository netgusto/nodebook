const { defaultInitNotebook } = require('../defaultInitNotebook');

const recipe = ({
    key: 'haskell',
    name: 'Haskell',
    language: 'Haskell',
    mainfile: ['index.hs', 'main.hs'],
    cmmode: 'haskell',
    dir: __dirname,
    execLocal: ({ notebook }) => ([
        'bash', '-c', 'ghc -v0 -H14m -outputdir /tmp -o /tmp/code ' + notebook.absdir + '/' + notebook.mainfilename + ' && /tmp/code',
    ]),
    execDocker: ({ notebook }) => ([
        'docker', 'run', '--rm',
        '-v', notebook.absdir + ':/code',
        'haskell:latest',
        'sh', '-c', 'ghc -v0 -H14m -outputdir /tmp -o /tmp/code "/code/' + notebook.mainfilename + '" && /tmp/code',
    ]),
    initNotebook: async ({ name, notebookspath }) => await defaultInitNotebook(recipe, notebookspath, name),
});

module.exports = recipe;
