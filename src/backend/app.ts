import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as compression from 'compression';
import * as http from 'http';

import { Trunk } from 'trunk';

import {
    handleHomePage,
    handleNoteBook,
    handleAPINoteBookSetContent,
    handleAPINoteBookExec,
    handleAPINoteBookStop,
    handleAPINoteBookNew,
    handleAPINoteBookRename,
} from './handlers';

import NotebookRegistry from './services/notebookregistry';
import RecipeRegistry from './services/reciperegistry';

interface AppParameters {
    port: number,
    bindaddress: string,
    notebookspath: string,
    logger: Function,
    docker: boolean,
};

export async function app({ port, bindaddress, notebookspath, logger, docker }: AppParameters) {

    process.chdir(notebookspath);

    const trunk = new Trunk();
    trunk
        .add('port', () => port)
        .add('bindaddress', () => bindaddress)
        .add('notebookspath', () => notebookspath)
        .add('docker', () => docker)
        .add('logger', () => logger)
        .add('reciperegistry', () => new RecipeRegistry())
        .add('notebookregistry', ['notebookspath', 'reciperegistry'], async (notebookspath: string, reciperegistry: RecipeRegistry) => {
            const notebookregistry = new NotebookRegistry(notebookspath, reciperegistry);
            await notebookregistry.mount();
            return notebookregistry;
        });
    
    await trunk.open();

    const app = express();

    app.use(bodyParser.json());
    app.use(compression({ filter: (req: any, res: any) => {
        if (req.headers['x-no-compression']) {
            // do not compress responses with this request header
            return false
        }

        if (req.route && req.route.path === '/api/notebook/:name/exec') {
            // do not compress exec response (streamed)
            return false;
        }
      
        // fallback to standard filter function
        return compression.filter(req, res)
    }}));

    app.get('/', handleHomePage({ trunk }));
    app.get('/notebook/:name', handleNoteBook({ trunk }));
    app.post('/api/notebook/new', handleAPINoteBookNew({ trunk }));
    app.post('/api/notebook/:name/rename', handleAPINoteBookRename({ trunk }));
    app.post('/api/notebook/:name/setcontent', handleAPINoteBookSetContent({ trunk }));
    app.post('/api/notebook/:name/exec', handleAPINoteBookExec({ trunk }));
    app.post('/api/notebook/:name/stop', handleAPINoteBookStop({ trunk }));

    app.use(express.static(__dirname + '/../../frontend'));

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

