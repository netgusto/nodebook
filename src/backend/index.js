const { app, sanitizeParameters } = require('./app');

async function start() {

    let parameters;
    try {
        parameters = await sanitizeParameters(process.argv.slice(2));
    } catch(e) {
        return console.error(e.message);
    }

    app({
        port: parameters.port,
        bindaddress: parameters.bindaddress,
        notebookspath: parameters.notebooks,
        docker: parameters.docker,
        logger: (msg) => console.log(msg),
    });
}

start();