const { lstat } = require('fs');
const { join: pathJoin } = require('path');
const { homedir } = require('os');

const { defaultInitNotebook } = require('../defaultInitNotebook');
const stdExec = require('../../stdexec');

const recipe = ({
    key: 'rust',
    name: 'Rust',
    language: 'Rust',
    mainfile: ['index.rs', 'main.rs'],
    cmmode: 'rust',
    dir: __dirname,

    exec: async ({ notebook, docker, writeStdOut, writeStdErr }) => {
        let command;

        const cargo = await rustHasCargo(notebook.absdir);

        if (docker) {
            let mounts = [];
            let subcmd = [];

            if (cargo) {
                const cargoregistry = pathJoin(rustCargoHome(), 'registry');
                mounts = ['-v', cargoregistry + ':/usr/local/cargo/registry'];
                subcmd = [
                    'sh', '-c', 'cd /code && cargo run',
                ];
            } else {
                subcmd = [
                    'sh', '-c', "rustc -o /tmp/code.out /code/" + notebook.mainfilename + " && /tmp/code.out"
                ];
            }

            command = [
                'docker', 'run', '--rm',
                '-v', notebook.absdir + ':/code',
                ...mounts,
                'rust:latest',
                ...subcmd,
            ];
        } else {
            if (cargo) {
                command = [
                    'sh', '-c', 'cd ' + notebook.absdir + ' && cargo run',
                ];
            } else {
                command = [
                    'sh', '-c', "rustc -o /tmp/code.out '" + notebook.abspath + "' && /tmp/code.out"
                ];
            }
        }

        return stdExec(command, writeStdOut, writeStdErr);
    },

    init: async ({ name, notebookspath }) => await defaultInitNotebook(recipe, notebookspath, name),
});

function rustHasCargo(absdir) {
    return new Promise((resolve) => {
        lstat(pathJoin(absdir, 'Cargo.toml'), (err, stats) => {
            resolve(!err && stats.isFile());
        });
    });
}

function rustCargoHome() {
    if (process.env['CARGO_HOME']) return process.env['CARGO_HOME'];
    return pathJoin(homedir(), '.cargo');
}

module.exports = recipe;
