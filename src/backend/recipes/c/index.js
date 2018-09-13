const { defaultInitNotebook } = require('../defaultInitNotebook');

const recipe = ({
    key: 'c',
    name: 'C11',
    language: 'C',
    mainfile: ['index.c', 'main.c'],
    cmmode: 'clike',
    dir: __dirname,
    execLocal: ({ notebook }) => ([
        'sh', '-c', "gcc -Wall -o /tmp/code.out '" + notebook.abspath + "' && /tmp/code.out"
    ]),
    execDocker: ({ notebook }) => ([
        'docker', 'run', '--rm',
        '-v', notebook.absdir + ':/code',
        'gcc:latest',
        'sh', '-c', "gcc -Wall -o /tmp/code.out /code/" + notebook.mainfilename + " && /tmp/code.out"
    ]),
    initNotebook: async ({ name, notebookspath }) => await defaultInitNotebook(recipe, notebookspath, name),
});

module.exports = recipe;