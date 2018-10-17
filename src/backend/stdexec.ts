import { spawn, ChildProcess } from 'child_process';
import * as kill from 'tree-kill';
import { ProcessInfo, WriterFunc } from './types';

export default function stdExec(processinfo: ProcessInfo, writeStdOut: WriterFunc, writeStdErr: WriterFunc, writeInfo: WriterFunc) {

    let child: ChildProcess;

    return {
        start: () => new Promise<void>(resolve => {

            const { cmd, cwd, env } = processinfo;

            child = spawn(cmd[0], cmd.slice(1), {
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
};