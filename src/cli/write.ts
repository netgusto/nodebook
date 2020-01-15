import * as chalk from 'chalk';

let lastmsg = '\n';
const writeStdout = (msg: string) => { process.stdout.write(msg); lastmsg = msg; }
const writeStderr = (msg: string) => { process.stdout.write(chalk.red(msg)); lastmsg = msg; }
const writeInfo = (msg: string) => {
    if (lastmsg.length && lastmsg[lastmsg.length-1] != '\n') {
        process.stdout.write(chalk.magenta('%') + '\n');
    }

    process.stdout.write(chalk.cyan(msg.split('\n').map(line => '>>> ' + line).join('\n')));
    lastmsg = msg;
}
const writeInfoLn = (msg: string) => {
    writeInfo(msg); process.stdout.write('\n')
    lastmsg = msg + '\n';
};

export {
    writeStdout,
    writeStderr,
    writeInfo,
    writeInfoLn,
};