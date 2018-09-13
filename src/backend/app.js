const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');

const { resolve, join: pathJoin, dirname } = require('path');

const {
    handleHomePage,
    handleNoteBook,
    handleAPINoteBookSetContent,
    handleAPINoteBookExec,
    handleAPINoteBookStop,
    handleAPINoteBookNew,
    handleAPINoteBookRename,
} = require('./handlers');

const { sanitizeParameters } = require('./sanitizeparameters');

module.exports = {
    app,
    sanitizeParameters,
};

function app({ port, bindaddress, notebookspath, logger, docker }) {

    process.chdir(notebookspath);

    const app = express();

    app.use(bodyParser.json());

    app.get('/', handleHomePage({ notebookspath }));
    app.get('/notebook/:name', handleNoteBook({ notebookspath }));
    app.post('/api/notebook/new', handleAPINoteBookNew({ notebookspath }));
    app.post('/api/notebook/:name/rename', handleAPINoteBookRename({ notebookspath }));
    app.post('/api/notebook/:name/setcontent', handleAPINoteBookSetContent({ notebookspath }));
    app.post('/api/notebook/:name/exec', handleAPINoteBookExec({ notebookspath, docker }));
    app.post('/api/notebook/:name/stop', handleAPINoteBookStop({ notebookspath, docker }));

    app.use(express.static(__dirname + '/../../dist'));

    const httpServer = http.createServer(app);
    httpServer.listen(port, bindaddress, () => logger('Listening on port ' + port));

    return httpServer;
}

