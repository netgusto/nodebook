const { exec } = require('child_process');
const { app, sanitizeParameters } = require('./app');

async function start() {

    let parameters;
    try {
        parameters = await sanitizeParameters(process.argv.slice(2));
    } catch(e) {
        return console.error(e.message);
    }

    if (parameters.docker && !await isDockerRunning()) {
        throw new Error('docker is not running on the host, but --docker requested.')
    }

    app({
        port: parameters.port,
        bindaddress: parameters.bindaddress,
        notebookspath: parameters.notebooks,
        docker: parameters.docker,
        logger: (msg) => console.log(msg),
    });
}

function isDockerRunning() {
    return new Promise(resolve => {
        exec('docker ps', err => resolve(err === null));
    });
}

(async function() {
    try {
        await start();
    } catch(e) {
        console.error(e.message);
    }
})();