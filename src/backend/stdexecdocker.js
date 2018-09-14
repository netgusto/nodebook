const Docker = require('dockerode');

module.exports = function stdExecDocker(command, writeStdOut, writeStdErr) {
    return {
        start: () => new Promise(resolve => {
            writeStdOut('START');
            resolve();
        }),
        stop: () => new Promise(resolve => {
            writeStdOut('STOP');
            resolve();
        }),
    };
};