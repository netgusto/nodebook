const { defaultInitNotebook } = require('../defaultInitNotebook');
const stdExec = require('../../stdexec');

const recipe = ({
    key: 'java',
    name: 'Java',
    language: 'Java',
    mainfile: ['index.java', 'main.java'],
    cmmode: 'clike',
    dir: __dirname,
    exec: ({ notebook, docker, writeStdOut, writeStdErr }) => {
        let command;

        if (docker) {
            command = [
                'docker', 'run', '--rm',
                '-v', notebook.absdir + ':/code',
                'java:latest',
                'sh', '-c', 'javac -d /tmp "/code/' + notebook.mainfilename + '" && cd /tmp && java Main'
            ];
        } else {
            command = [
                'sh', '-c', 'javac -d /tmp "' + notebook.absdir + '/' + notebook.mainfilename + '" && cd /tmp && java Main',
            ];
        }

        return stdExec(command, writeStdOut, writeStdErr);
    },
    init: async ({ name, notebookspath }) => await defaultInitNotebook(recipe, notebookspath, name),
});

module.exports = recipe;