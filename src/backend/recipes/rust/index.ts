import { lstat } from 'fs';
import { join as pathJoin } from 'path';
import { homedir } from 'os';

import { defaultInitNotebook } from '../defaultInitNotebook';
import stdExec from '../../stdexec';
import stdExecDocker from '../../stdexecdocker';
import { Recipe, ContainerMount } from '../../types';

const recipe: Recipe = ({
    key: 'rust',
    name: 'Rust',
    language: 'Rust',
    mainfile: ['index.rs', 'main.rs'],
    cmmode: 'rust',
    dir: __dirname,

    exec: async ({ notebook, docker, writeStdOut, writeStdErr, writeInfo, env }) => {

        const cargo = await rustHasCargo(notebook.absdir);

        if (docker) {
            let mounts: ContainerMount[] = [];
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
                env,
            }, writeStdOut, writeStdErr, writeInfo);
        } else {
            if (cargo) {
                return stdExec({
                    cmd: ['cargo', 'run'],
                    cwd: notebook.absdir,
                    env,
                }, writeStdOut, writeStdErr, writeInfo);
            } else {
                return stdExec({
                    cmd: [
                        'sh', '-c', "rustc -o /tmp/code.out " + notebook.mainfilename + " && /tmp/code.out"
                    ],
                    cwd: notebook.absdir,
                    env,
                }, writeStdOut, writeStdErr, writeInfo);
            }
        }
    },

    init: async ({ name, notebookspath }) => await defaultInitNotebook(recipe, notebookspath, name),
});

function rustHasCargo(absdir: string ) {
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

export default recipe;
