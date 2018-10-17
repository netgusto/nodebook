import { performance } from 'perf_hooks';
import { execNotebook } from '../backend/notebook';
import { writeInfo, writeInfoLn, writeStdout, writeStderr } from './write';

export {
    withProcessQueue,
    withSameNotebookChangeThrottle,
    onNotebookChange,
}; 

// Ensures only one notebook is running at a time
function withProcessQueue(f) {

    const queue = [];
    let running = false;
    return async (notebook) => {
        queue.push(notebook);
        if (!running) {
            running = true;
            while(queue.length) {
                const next = queue.shift();
                await f(next);
            }
            running = false;
        }
    };
}

// VSCode touches file twice when saving; https://github.com/Microsoft/vscode/issues/9419
function withSameNotebookChangeThrottle(f, throttleMs) {
    let prevchangeByNotebook = new Map();
    return async (notebook) => {
        const now = performance.now();
        let prevchange = null;
        if (prevchangeByNotebook.has(notebook.name)) {
            prevchange = prevchangeByNotebook.get(notebook.name);
        }

        prevchangeByNotebook.set(notebook.name, now);

        if (prevchange === null || (now-prevchange) > throttleMs) {
            return f(notebook);
        }
    };
}

const write = (str) => {
    const data = JSON.parse(str);
    const msg = JSON.parse(data.data);
    switch (data.chan) {
        case 'stdout': writeStdout(msg); break;
        case 'stderr': writeStderr(msg); break;
        case 'info': writeInfo(msg); break;
    }
};

async function onNotebookChange(notebook, docker, eventbus) {

    const starttime = performance.now();

    const res = {
        writable: true,
        finished: false,
        write,
    };

    const label = notebook.name + ' (' + notebook.recipe.name + ')';

    writeInfoLn('Executing: ' + label + '; interrupt with Ctrl+c');

    const { start, stop } = await execNotebook(notebook, docker, res);
    let interrupted = false;
    const sigIntHandler = (preventDefault) => {
        preventDefault();

        // Ctrl+c outputs ^C in some terminals
        // writing on a new line to avoid being shifted right by 2 chars
        writeStdout('\n');
        writeInfoLn('Interrupting...');
        stop();
        writeInfoLn('Interrupted ' + label);
        interrupted = true;
    };

    eventbus.on('SIGINT', sigIntHandler);
    await start();
    eventbus.removeListener('SIGINT', sigIntHandler);
    if (!interrupted) {
        writeInfoLn('Done; took ' + (performance.now() - starttime).toFixed(1) + 'ms');
    }  
}