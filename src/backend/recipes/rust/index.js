const { lstat } = require('fs');
const { join: pathJoin } = require('path');
const { homedir } = require('os');

const { defaultInitNotebook } = require('../defaultInitNotebook');
const stdExec = require('../../stdexec');
const stdExecDocker = require('../../stdexecdocker');

const recipe = ({
    key: 'rust',
    name: 'Rust',
    language: 'Rust',
    mainfile: ['index.rs', 'main.rs'],
    cmmode: 'rust',
    dir: __dirname,

    exec: async ({ notebook, docker, writeStdOut, writeStdErr, writeInfo }) => {

        const cargo = await rustHasCargo(notebook.absdir);

        if (docker) {
            let mounts = [];
            let cmd = [];

            if (cargo) {
                const cargoregistry = pathJoin(rustCargoHome(), 'registry');
                mounts = [{ from: cargoregistry, to: '/usr/local/cargo/registry', mode: 'rw' }];
                cmd = [
                    'sh', '-c', 'cd /code && cargo run',
                ];
            } else {
                cmd = [
                    'sh', '-c', "rustc -o /tmp/code.out /code/" + notebook.mainfilename + " && /tmp/code.out"
                ];
            }

            return stdExecDocker({
                image: 'rust:latest',
                cmd,
                cwd: '/code',
                mounts: [
                    { from: notebook.absdir, to: '/code', mode: 'rw' },
                    ...mounts,
                ],
            }, writeStdOut, writeStdErr, writeInfo);
        } else {
            if (cargo) {
                return stdExec([
                    'sh', '-c', 'cd ' + notebook.absdir + ' && cargo run',
                ], writeStdOut, writeStdErr, writeInfo);
            } else {
                return stdExec([
                    'sh', '-c', "rustc -o /tmp/code.out '" + notebook.abspath + "' && /tmp/code.out"
                ], writeStdOut, writeStdErr, writeInfo);
            }
        }
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
