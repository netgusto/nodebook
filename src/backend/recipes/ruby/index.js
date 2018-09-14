const { defaultInitNotebook } = require('../defaultInitNotebook');
const stdExec = require('../../stdexec');

const recipe = ({
    key: 'ruby',
    name: 'Ruby',
    language: 'Ruby',
    mainfile: ['index.rb', 'main.rb'],
    cmmode: 'ruby',
    dir: __dirname,
    exec: ({ notebook, docker, writeStdOut, writeStdErr }) => {
        let command;

        if (docker) {
            command = [
                'docker', 'run', '--rm',
                '-v', notebook.absdir + ':/code',
                'ruby:latest',
                'ruby', '/code/' + notebook.mainfilename,
            ];
        } else {
            command = [
                'ruby', notebook.absdir + '/' + notebook.mainfilename,
            ];
        }

        return stdExec(command, writeStdOut, writeStdErr);
    },
    init: async ({ name, notebookspath }) => await defaultInitNotebook(recipe, notebookspath, name),
});

module.exports = recipe;
