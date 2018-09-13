const { defaultInitNotebook } = require('../defaultInitNotebook');

const recipe = ({
    key: 'lua',
    name: 'Lua',
    language: 'Lua',
    mainfile: ['index.lua', 'main.lua'],
    cmmode: 'lua',
    dir: __dirname,
    execLocal: ({ notebook }) => ([
        'lua', notebook.absdir + '/' + notebook.mainfilename,
    ]),
    execDocker: ({ notebook }) => ([
        'docker', 'run', '--rm',
        '-v', notebook.absdir + ':/code',
        'superpaintman/lua:latest',
        'lua', '/code/' + notebook.mainfilename,
    ]),
    initNotebook: async ({ name, notebookspath }) => await defaultInitNotebook(recipe, notebookspath, name),
});

module.exports = recipe;
