const { defaultInitNotebook } = require('../defaultInitNotebook');

const recipe = ({
    key: 'java',
    name: 'Java',
    language: 'Java',
    mainfile: ['index.java', 'main.java'],
    cmmode: 'clike',
    dir: __dirname,
    execLocal: ({ notebook }) => ([
        'sh', '-c', 'javac -d /tmp "' + notebook.absdir + '/' + notebook.mainfilename + '" && cd /tmp && java Main',
    ]),
    execDocker: ({ notebook }) => ([
        'docker', 'run', '--rm',
        '-v', notebook.absdir + ':/code',
        'java:latest',
        'sh', '-c', 'javac -d /tmp "/code/' + notebook.mainfilename + '" && cd /tmp && java Main'
    ]),
    initNotebook: async ({ name, notebookspath }) => await defaultInitNotebook(recipe, notebookspath, name),
});

module.exports = recipe;