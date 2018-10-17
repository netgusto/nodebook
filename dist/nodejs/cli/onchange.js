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
const perf_hooks_1 = require("perf_hooks");
const notebook_1 = require("../backend/notebook");
const write_1 = require("./write");
// Ensures only one notebook is running at a time
function withProcessQueue(f) {
    const queue = [];
    let running = false;
    return (notebook) => __awaiter(this, void 0, void 0, function* () {
        queue.push(notebook);
        if (!running) {
            running = true;
            while (queue.length) {
                const next = queue.shift();
                yield f(next);
            }
            running = false;
        }
    });
}
exports.withProcessQueue = withProcessQueue;
// VSCode touches file twice when saving; https://github.com/Microsoft/vscode/issues/9419
function withSameNotebookChangeThrottle(f, throttleMs) {
    let prevchangeByNotebook = new Map();
    return (notebook) => __awaiter(this, void 0, void 0, function* () {
        const now = perf_hooks_1.performance.now();
        let prevchange = null;
        if (prevchangeByNotebook.has(notebook.name)) {
            prevchange = prevchangeByNotebook.get(notebook.name);
        }
        prevchangeByNotebook.set(notebook.name, now);
        if (prevchange === null || (now - prevchange) > throttleMs) {
            return f(notebook);
        }
    });
}
exports.withSameNotebookChangeThrottle = withSameNotebookChangeThrottle;
const write = (str) => {
    const data = JSON.parse(str);
    const msg = JSON.parse(data.data);
    switch (data.chan) {
        case 'stdout':
            write_1.writeStdout(msg);
            break;
        case 'stderr':
            write_1.writeStderr(msg);
            break;
        case 'info':
            write_1.writeInfo(msg);
            break;
    }
};
function onNotebookChange(notebook, docker, eventbus) {
    return __awaiter(this, void 0, void 0, function* () {
        const starttime = perf_hooks_1.performance.now();
        const res = {
            writable: true,
            finished: false,
            write,
        };
        const label = notebook.name + ' (' + notebook.recipe.name + ')';
        write_1.writeInfoLn('Executing: ' + label + '; interrupt with Ctrl+c');
        const { start, stop } = yield notebook_1.execNotebook(notebook, docker, res);
        let interrupted = false;
        const sigIntHandler = (preventDefault) => {
            preventDefault();
            // Ctrl+c outputs ^C in some terminals
            // writing on a new line to avoid being shifted right by 2 chars
            write_1.writeStdout('\n');
            write_1.writeInfoLn('Interrupting...');
            stop();
            write_1.writeInfoLn('Interrupted ' + label);
            interrupted = true;
        };
        eventbus.on('SIGINT', sigIntHandler);
        yield start();
        eventbus.removeListener('SIGINT', sigIntHandler);
        if (!interrupted) {
            write_1.writeInfoLn('Done; took ' + (perf_hooks_1.performance.now() - starttime).toFixed(1) + 'ms');
        }
    });
}
exports.onNotebookChange = onNotebookChange;
