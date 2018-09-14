const { spawn } = require('child_process');
const kill = require('tree-kill');

module.exports = function stdExec(command, writeStdOut, writeStdErr) {

    let child;

    return {
        start: () => new Promise(resolve => {
            child = spawn(command[0], command.slice(1));

            child.on('error', err => writeStdErr(err.message + "\n"));

            child.stdout.on('data', chunk => writeStdOut(chunk.toString('utf-8')));

            child.stderr.on('data', chunk => writeStdErr(chunk.toString('utf-8')));

            child.on('close', (code) => {
                if (code !== 0) {
                    writeStdErr("Process exited with status code " + code + "\n");
                }

                resolve(() => kill(child.pid));
            });
        }),
        stop: () => {
            return Promise.resolve(child && kill(child.pid, 'SIGKILL'));
        },
    };
};