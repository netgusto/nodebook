const { app, sanitizeParameters } = require('./app');

function start() {

    let parameters;
    try {
        parameters = sanitizeParameters(process.argv.slice(2));
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