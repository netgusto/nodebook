const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');

const { resolve, join: pathJoin, dirname } = require('path');

const {
    handleHomePage,
    handleNoteBook,
    handleAPINoteBookSetContent,
    handleAPINoteBookExec,
    handleAPINoteBookNew,
} = require('./handlers');

const { sanitizeParameters } = require('./sanitizeparameters');

module.exports = {
    app,
    sanitizeParameters,
};

function app({ port, bindaddress, notebookspath, logger, docker }) {

    const app = express();

    const defaultcontentsdir = resolve(pathJoin(dirname(__filename), 'defaultcontent'));

    app.use(bodyParser.json());

    app.get('/', handleHomePage({ notebookspath }));
    app.get('/notebook/:name', handleNoteBook({ notebookspath }));
    app.post('/api/notebook/new', handleAPINoteBookNew({ notebookspath, defaultcontentsdir }));
    app.post('/api/notebook/:name/setcontent', handleAPINoteBookSetContent({ notebookspath }));
    app.post('/api/notebook/:name/exec', handleAPINoteBookExec({ notebookspath, docker }));

    app.use(express.static(__dirname + '/../../dist'));

    const httpServer = http.createServer(app);
    httpServer.listen(port, bindaddress, () => logger('Listening on port ' + port));

    return httpServer;
}

