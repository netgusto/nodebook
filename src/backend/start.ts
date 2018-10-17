import { exec } from 'child_process';
import { app } from './app';
import { sanitizeParameters } from './sanitizeparameters';

export default async function start() {

    let parameters;
    try {
        parameters = await sanitizeParameters(process.argv.slice(2));
    } catch(e) {
        return console.error(e.message);
    }

    if (parameters.docker && !await isDockerRunning()) {
        throw new Error('docker is not running on the host, but --docker requested.')
    }

    const service = await app({
        port: parameters.port,
        bindaddress: parameters.bindaddress,
        notebookspath: parameters.notebooks,
        docker: parameters.docker,
        logger: (msg) => console.log(msg),
    });

    return { service, parameters };
};

function isDockerRunning() {
    return new Promise(resolve => {
        exec('docker ps', err => resolve(err === null));
    });
};