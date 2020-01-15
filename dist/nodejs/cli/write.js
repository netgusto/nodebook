"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk = require("chalk");
let lastmsg = '\n';
const writeStdout = (msg) => { process.stdout.write(msg); lastmsg = msg; };
exports.writeStdout = writeStdout;
const writeStderr = (msg) => { process.stdout.write(chalk.red(msg)); lastmsg = msg; };
exports.writeStderr = writeStderr;
const writeInfo = (msg) => {
    if (lastmsg.length && lastmsg[lastmsg.length - 1] != '\n') {
        process.stdout.write(chalk.magenta('%') + '\n');
    }
    process.stdout.write(chalk.cyan(msg.split('\n').map(line => '>>> ' + line).join('\n')));
    lastmsg = msg;
};
exports.writeInfo = writeInfo;
const writeInfoLn = (msg) => {
    writeInfo(msg);
    process.stdout.write('\n');
    lastmsg = msg + '\n';
};
exports.writeInfoLn = writeInfoLn;
