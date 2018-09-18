const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');

const { Trunk } = require('trunk');

const {
    handleHomePage,
    handleNoteBook,
    handleAPINoteBookSetContent,
    handleAPINoteBookExec,
    handleAPINoteBookStop,
    handleAPINoteBookNew,
    handleAPINoteBookRename,
} = require('./handlers');

const NotebookRegistry = require('./services/notebookregistry');
const RecipeRegistry = require('./services/reciperegistry');

module.exports = {
    app,
};

async function app({ port, bindaddress, notebookspath, logger, docker }) {

    process.chdir(notebookspath);

    const trunk = new Trunk();
    trunk
        .add('port', () => port)
        .add('bindaddress', () => bindaddress)
        .add('notebookspath', () => notebookspath)
        .add('docker', () => docker)
        .add('logger', () => logger)
        .add('reciperegistry', () => new RecipeRegistry())
        .add('notebookregistry', ['notebookspath', 'reciperegistry'], async (notebookspath, reciperegistry) => {
            const notebookregistry = new NotebookRegistry(notebookspath, reciperegistry);
            await notebookregistry.mount();
            return notebookregistry;
        });
    
    await trunk.open();

    const app = express();

    app.use(bodyParser.json());

    app.get('/', handleHomePage({ trunk }));
    app.get('/notebook/:name', handleNoteBook({ trunk }));
    app.post('/api/notebook/new', handleAPINoteBookNew({ trunk }));
    app.post('/api/notebook/:name/rename', handleAPINoteBookRename({ trunk }));
    app.post('/api/notebook/:name/setcontent', handleAPINoteBookSetContent({ trunk }));
    app.post('/api/notebook/:name/exec', handleAPINoteBookExec({ trunk }));
    app.post('/api/notebook/:name/stop', handleAPINoteBookStop({ trunk }));

    app.use(express.static(__dirname + '/../../dist'));

    const httpServer = http.createServer(app);
    await new Promise(resolve => {
        httpServer.listen(port, bindaddress, () => {
            logger('Listening on port ' + trunk.get('port'));
            resolve();
        });
    });

    httpServer.on('close', async () => {
        await trunk.get('notebookregistry').unmount();
    });

    return httpServer;
}

