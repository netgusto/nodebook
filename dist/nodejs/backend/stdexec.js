"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const kill = require("tree-kill");
function stdExec(processinfo, writeStdOut, writeStdErr, writeInfo) {
    let child;
    return {
        start: () => new Promise(resolve => {
            const { cmd, cwd, env } = processinfo;
            child = child_process_1.spawn(cmd[0], cmd.slice(1), {
                cwd,
                env: Object.assign({}, process.env, env),
            });
            child.on('error', err => writeStdErr(err.message + "\n"));
            child.stdout.on('data', chunk => writeStdOut(chunk.toString('utf-8')));
            child.stderr.on('data', chunk => writeStdErr(chunk.toString('utf-8')));
            child.on('close', (code) => {
                if (code !== 0) {
                    writeStdErr("Process exited with status code " + code + "\n");
                }
                resolve();
            });
        }),
        stop: () => {
            child && kill(child.pid, 'SIGKILL');
            return Promise.resolve();
        },
    };
}
exports.default = stdExec;
;
