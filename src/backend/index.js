const { app, sanitizeParameters } = require('./app');

let parameters;
try {
    parameters = sanitizeParameters(process.argv.slice(2));
} catch(e) {
    return console.error(e.message);
}

let execCommand;
if (parameters.docker) {
    execCommand = ({ notebook }) =>  ([
        'docker', 'run', '--rm',
        '-v', notebook.absdir + ':/code',
        'node:alpine',
        'node', '/code',
    ]);
} else {
    execCommand = ({ notebook }) =>  ([
        'node', '--harmony', notebook.absdir,
    ]);
}

app({
    port: parameters.port,
    bindaddress: parameters.bindaddress,
    notebookspath: parameters.notebooks,
    execCommand,
    logger: (msg) => console.log(msg),
});
