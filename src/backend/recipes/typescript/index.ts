import { join as  pathJoin } from 'path';
import { exec } from 'child_process';
import { lstat } from 'fs';

import { defaultInitNotebook } from '../defaultInitNotebook';
import stdExec from '../../stdexec';
import stdExecDocker from '../../stdexecdocker';
import { Recipe } from '../../types';

const recipe: Recipe = ({
    key: 'typescript',
    name: 'TypeScript',
    language: 'TypeScript',
    mainfile: ['index.ts', 'main.ts'],
    cmmode: 'javascript',
    dir: __dirname,
    exec: async ({ notebook, docker, writeStdOut, writeStdErr, writeInfo, env }) => {

        const tsnode = await hasTsNode(notebook.absdir);

        if (docker) {

            let cmd;

            if (tsnode) {
                cmd = [
                    'sh', '-c', 'node_modules/.bin/ts-node ' + notebook.mainfilename,
                ];
            } else {
                cmd = [
                    'sh', '-c', "tsc --allowJs --outFile /tmp/code.js " + notebook.mainfilename + " && node /tmp/code.js"
                ];
            }

            return stdExecDocker({
                image: 'sandrokeil/typescript',
                cmd,
                cwd: '/app',
                mounts: [
                    { from: notebook.absdir, to: '/app', mode: 'rw' },
                ],
                env,
            }, writeStdOut, writeStdErr, writeInfo);

        } else {
            if (tsnode) {
                return stdExec({
                    cmd: ['sh', '-c', 'node_modules/.bin/ts-node ' + notebook.mainfilename],
                    cwd: notebook.absdir,
                    env,
                }, writeStdOut, writeStdErr, writeInfo);
            } else {
                return stdExec({
                    cmd: [
                        'sh', '-c', 'tsc --allowJs --outFile /tmp/code.js "' + notebook.mainfilename + '" && node /tmp/code.js',
                    ],
                    cwd: notebook.absdir,
                    env,
                }, writeStdOut, writeStdErr, writeInfo);
            }
        }
    },
    init: async ({ name, notebookspath }) => {
        const copied = await defaultInitNotebook(recipe, notebookspath, name);
        if (!copied) return Promise.resolve(false);

        const notebookabsdir = pathJoin(notebookspath, name);
        return new Promise<boolean>(resolve => {
            exec('npm i --silent --audit false --prefer-offline --progress false', { cwd: notebookabsdir }, err => {
                if (err) return resolve(false);
                resolve(true);
            });
        });
    },
});

function hasTsNode(absdir: string) {
    return new Promise((resolve) => {
        lstat(pathJoin(absdir, 'node_modules/.bin/ts-node'), (err, stats) => {
            resolve(!err && (stats.isFile() || stats.isSymbolicLink()));
        });
    });
}

export default recipe;
