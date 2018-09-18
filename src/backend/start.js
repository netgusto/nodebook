const { exec } = require('child_process');
const { app } = require('./app');
const { sanitizeParameters } = require('./sanitizeparameters');

module.exports = async function start() {

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