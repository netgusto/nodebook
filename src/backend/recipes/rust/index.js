const { lstat } = require('fs');
const { join: pathJoin } = require('path');
const { homedir } = require('os');

const { defaultInitNotebook } = require('../defaultInitNotebook');

const recipe = ({
    key: 'rust',
    name: 'Rust',
    language: 'Rust',
    mainfile: ['index.rs', 'main.rs'],
    cmmode: 'rust',
    dir: __dirname,
    execLocal: async ({ notebook }) => {

        if (await rustHasCargo(notebook.absdir)) {
            return [
                'sh', '-c', 'cd ' + notebook.absdir + ' && cargo run',
            ];
        }

        return [
            'sh', '-c', "rustc -o /tmp/code.out '" + notebook.abspath + "' && /tmp/code.out"
        ];
    },
    execDocker: async ({ notebook }) => {
        let cmd = [];
        let mounts = [];

        if (await rustHasCargo(notebook.absdir)) {
            const cargoregistry = pathJoin(rustCargoHome(), 'registry');
            mounts = ['-v', cargoregistry + ':/usr/local/cargo/registry'];

            cmd = [
                'sh', '-c', 'cd /code && cargo run',
            ];
        } else {
            cmd = [
                'sh', '-c', "rustc -o /tmp/code.out /code/" + notebook.mainfilename + " && /tmp/code.out"
            ];
        }

        return [
            'docker', 'run', '--rm',
            '-v', notebook.absdir + ':/code',
            ...mounts,
            'rust:latest',
            ...cmd,
        ];
    },
    initNotebook: async ({ name, notebookspath }) => await defaultInitNotebook(recipe, notebookspath, name),
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
