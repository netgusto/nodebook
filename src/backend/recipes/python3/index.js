const { defaultInitNotebook } = require('../defaultInitNotebook');

const recipe = ({
    key: 'python3',
    name: 'Python 3',
    language: 'Python',
    mainfile: ['index.py', 'main.py'],
    cmmode: 'python',
    dir: __dirname,
    execLocal: ({ notebook }) => ([
        'python', notebook.absdir + '/' + notebook.mainfilename,
    ]),
    execDocker: ({ notebook }) => ([
        'docker', 'run', '--rm',
        '-v', notebook.absdir + ':/code',
        'python:3',
        'python', '/code/' + notebook.mainfilename,
    ]),
    initNotebook: async ({ name, notebookspath }) => await defaultInitNotebook(recipe, notebookspath, name),
});

module.exports = recipe;
