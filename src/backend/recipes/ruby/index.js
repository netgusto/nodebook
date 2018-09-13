const { defaultInitNotebook } = require('../defaultInitNotebook');

const recipe = ({
    key: 'ruby',
    name: 'Ruby',
    language: 'Ruby',
    mainfile: ['index.rb', 'main.rb'],
    cmmode: 'ruby',
    dir: __dirname,
    execLocal: ({ notebook }) => ([
        'ruby', notebook.absdir + '/' + notebook.mainfilename,
    ]),
    execDocker: ({ notebook }) => ([
        'docker', 'run', '--rm',
        '-v', notebook.absdir + ':/code',
        'ruby:latest',
        'ruby', '/code/' + notebook.mainfilename,
    ]),
    initNotebook: async ({ name, notebookspath }) => await defaultInitNotebook(recipe, notebookspath, name),
});

module.exports = recipe;
