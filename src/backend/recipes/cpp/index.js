const { defaultInitNotebook } = require('../defaultInitNotebook');

const recipe = ({
    key: 'cpp',
    name: 'C++14',
    language: 'C++',
    mainfile: ['index.cpp', 'main.cpp'],
    cmmode: 'clike',
    dir: __dirname,
    execLocal: ({ notebook }) => ([
        'sh', '-c', "g++ -std=c++14 -Wall -o /tmp/code.out '" + notebook.abspath + "' && /tmp/code.out"
    ]),
    execDocker: ({ notebook }) => ([
        'docker', 'run', '--rm',
        '-v', notebook.absdir + ':/code',
        'gcc:latest',
        'sh', '-c', "g++ -std=c++14 -Wall -o /tmp/code.out /code/" + notebook.mainfilename + " && /tmp/code.out"
    ]),
    initNotebook: async ({ name, notebookspath }) => await defaultInitNotebook(recipe, notebookspath, name),
});

module.exports = recipe;