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
const fs_1 = require("fs");
const path_1 = require("path");
const os_1 = require("os");
const defaultInitNotebook_1 = require("../defaultInitNotebook");
const stdexec_1 = require("../../stdexec");
const stdexecdocker_1 = require("../../stdexecdocker");
const recipe = ({
    key: 'rust',
    name: 'Rust',
    language: 'Rust',
    mainfile: ['index.rs', 'main.rs'],
    cmmode: 'rust',
    dir: __dirname,
    exec: ({ notebook, docker, writeStdOut, writeStdErr, writeInfo, env }) => __awaiter(this, void 0, void 0, function* () {
        const cargo = yield rustHasCargo(notebook.absdir);
        if (docker) {
            let mounts = [];
            let cmd = [];
            if (cargo) {
                const cargoregistry = path_1.join(rustCargoHome(), 'registry');
                mounts = [{ from: cargoregistry, to: '/usr/local/cargo/registry', mode: 'rw' }];
                cmd = [
                    'sh', '-c', 'cd /code && cargo run',
                ];
            }
            else {
                cmd = [
                    'sh', '-c', "rustc -o /tmp/code.out /code/" + notebook.mainfilename + " && /tmp/code.out"
                ];
            }
            return stdexecdocker_1.default({
                image: 'rust:latest',
                cmd,
                cwd: '/code',
                mounts: [
                    { from: notebook.absdir, to: '/code', mode: 'rw' },
                    ...mounts,
                ],
                env,
            }, writeStdOut, writeStdErr, writeInfo);
        }
        else {
            if (cargo) {
                return stdexec_1.default({
                    cmd: ['cargo', 'run'],
                    cwd: notebook.absdir,
                    env,
                }, writeStdOut, writeStdErr, writeInfo);
            }
            else {
                return stdexec_1.default({
                    cmd: [
                        'sh', '-c', "rustc -o /tmp/code.out " + notebook.mainfilename + " && /tmp/code.out"
                    ],
                    cwd: notebook.absdir,
                    env,
                }, writeStdOut, writeStdErr, writeInfo);
            }
        }
    }),
    init: ({ name, notebookspath }) => __awaiter(this, void 0, void 0, function* () { return yield defaultInitNotebook_1.defaultInitNotebook(recipe, notebookspath, name); }),
});
function rustHasCargo(absdir) {
    return new Promise((resolve) => {
        fs_1.lstat(path_1.join(absdir, 'Cargo.toml'), (err, stats) => {
            resolve(!err && stats.isFile());
        });
    });
}
function rustCargoHome() {
    if (process.env['CARGO_HOME'])
        return process.env['CARGO_HOME'];
    return path_1.join(os_1.homedir(), '.cargo');
}
exports.default = recipe;
