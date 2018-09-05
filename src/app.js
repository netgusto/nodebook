const express = require('express');
const bodyParser = require('body-parser');
const minimist = require('minimist');
const fs = require('fs');
const { resolve: resolvePath } = require('path');

const { handleHomePage, handleNoteBook, handleNoteBookSetContent, handleNoteBookExec } = require('./handlers');

module.exports = {
    app,
    sanitizeParameters,
};

function app({ port, bindaddress, notebookspath, execCommand }) {
    const app = express();

    app.use(bodyParser.json());

    app.get('/', handleHomePage({ notebookspath }));
    app.get('/notebook/:name', handleNoteBook({ notebookspath }));
    app.post('/notebook/:name/setcontent', handleNoteBookSetContent({ notebookspath }));
    app.post('/notebook/:name/exec', handleNoteBookExec({ notebookspath, execCommand }));

    app.listen(port, bindaddress, () => console.log('Listening on port ' + port));
}

function sanitizeParameters(rawargv) {
    const argv = minimist(rawargv);

    if (!("notebooks" in argv)) throw new Error("--notebooks path/to/notebooks is required.");
    
    const port = parseInt(argv.port, 10) || 8000;
    const notebooks = resolvePath(argv.notebooks);
    const bindaddress = argv.bindaddress || "127.0.0.1";

    const docker = ("docker" in argv);

    try {
        if (!fs.statSync(notebooks).isDirectory()) throw new Error("--notebooks is not a directory.");
    } catch(e) {
        throw new Error("--notebooks does not exist.");
    }
    
    if (port <= 0 || port > 65535) throw new Error("Invalid port");

    return { notebooks, port, bindaddress, docker };
}
