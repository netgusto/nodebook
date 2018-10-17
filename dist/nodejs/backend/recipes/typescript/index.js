"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const defaultInitNotebook_1 = require("../defaultInitNotebook");
const stdexec_1 = require("../../stdexec");
const stdexecdocker_1 = require("../../stdexecdocker");
const recipe = ({
    key: 'typescript',
    name: 'TypeScript',
    language: 'TypeScript',
    mainfile: ['index.ts', 'main.ts'],
    cmmode: 'javascript',
    dir: __dirname,
    exec: ({ notebook, docker, writeStdOut, writeStdErr, writeInfo, env }) => __awaiter(this, void 0, void 0, function* () {
        const tsnode = yield hasTsNode(notebook.absdir);
        if (docker) {
            let cmd;
            if (tsnode) {
                cmd = [
                    'sh', '-c', 'node_modules/.bin/ts-node ' + notebook.mainfilename,
                ];
            }
            else {
                cmd = [
                    'sh', '-c', "tsc --allowJs --outFile /tmp/code.js " + notebook.mainfilename + " && node /tmp/code.js"
                ];
            }
            return stdexecdocker_1.default({
                image: 'sandrokeil/typescript',
                cmd,
                cwd: '/app',
                mounts: [
                    { from: notebook.absdir, to: '/app', mode: 'rw' },
                ],
                env,
            }, writeStdOut, writeStdErr, writeInfo);
        }
        else {
            if (tsnode) {
                return stdexec_1.default({
                    cmd: ['sh', '-c', 'node_modules/.bin/ts-node ' + notebook.mainfilename],
                    cwd: notebook.absdir,
                    env,
                }, writeStdOut, writeStdErr, writeInfo);
            }
            else {
                return stdexec_1.default({
                    cmd: [
                        'sh', '-c', 'tsc --allowJs --outFile /tmp/code.js "' + notebook.mainfilename + '" && node /tmp/code.js',
                    ],
                    cwd: notebook.absdir,
                    env,
                }, writeStdOut, writeStdErr, writeInfo);
            }
        }
    }),
    init: ({ name, notebookspath }) => __awaiter(this, void 0, void 0, function* () {
        const copied = yield defaultInitNotebook_1.defaultInitNotebook(recipe, notebookspath, name);
        if (!copied)
            return false;
        const notebookabsdir = path_1.join(notebookspath, name);
        return new Promise(resolve => {
            child_process_1.exec('npm i --silent --audit false --prefer-offline --progress false', { cwd: notebookabsdir }, err => {
                if (err)
                    return resolve(false);
                resolve(true);
            });
        });
    }),
});
function hasTsNode(absdir) {
    return new Promise((resolve) => {
        fs_1.lstat(path_1.join(absdir, 'node_modules/.bin/ts-node'), (err, stats) => {
            resolve(!err && (stats.isFile() || stats.isSymbolicLink()));
        });
    });
}
exports.default = recipe;
