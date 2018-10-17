import { exec } from 'child_process';
import sanitizeParameters from './sanitizeparameters';
import cli from './cli';

(async function () {

    let parameters;
    try {
        parameters = await sanitizeParameters(process.argv.slice(2));
    } catch (e) {
        return console.error(e.message);
    }

    if (parameters.docker && !await isDockerRunning()) {
        throw new Error('docker is not running on the host, but --docker requested.')
    }

    try {
        await cli({
            notebookspath: parameters.notebooks,
            logger: console.log,
            docker: parameters.docker,
        });
    } catch (e) {
        console.error(e);
    }

})();

function isDockerRunning() {
    return new Promise(resolve => {
        exec('docker ps', err => resolve(err === null));
    });
};