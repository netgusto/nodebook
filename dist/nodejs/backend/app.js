"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const bodyParser = require("body-parser");
const compression = require("compression");
const http = require("http");
const trunk_1 = require("trunk");
const handlers_1 = require("./handlers");
const notebookregistry_1 = require("./services/notebookregistry");
const reciperegistry_1 = require("./services/reciperegistry");
;
function app({ port, bindaddress, notebookspath, logger, docker }) {
    return __awaiter(this, void 0, void 0, function* () {
        process.chdir(notebookspath);
        const trunk = new trunk_1.Trunk();
        trunk
            .add('port', () => port)
            .add('bindaddress', () => bindaddress)
            .add('notebookspath', () => notebookspath)
            .add('docker', () => docker)
            .add('logger', () => logger)
            .add('reciperegistry', () => new reciperegistry_1.default())
            .add('notebookregistry', ['notebookspath', 'reciperegistry'], (notebookspath, reciperegistry) => __awaiter(this, void 0, void 0, function* () {
            const notebookregistry = new notebookregistry_1.default(notebookspath, reciperegistry);
            yield notebookregistry.mount();
            return notebookregistry;
        }));
        yield trunk.open();
        const app = express();
        app.use(bodyParser.json());
        app.use(compression({ filter: (req, res) => {
                if (req.headers['x-no-compression']) {
                    // do not compress responses with this request header
                    return false;
                }
                if (req.route && req.route.path === '/api/notebook/:name/exec') {
                    // do not compress exec response (streamed)
                    return false;
                }
                // fallback to standard filter function
                return compression.filter(req, res);
            } }));
        app.get('/', handlers_1.handleHomePage({ trunk }));
        app.get('/notebook/:name', handlers_1.handleNoteBook({ trunk }));
        app.post('/api/notebook/new', handlers_1.handleAPINoteBookNew({ trunk }));
        app.post('/api/notebook/:name/rename', handlers_1.handleAPINoteBookRename({ trunk }));
        app.post('/api/notebook/:name/setcontent', handlers_1.handleAPINoteBookSetContent({ trunk }));
        app.post('/api/notebook/:name/exec', handlers_1.handleAPINoteBookExec({ trunk }));
        app.post('/api/notebook/:name/stop', handlers_1.handleAPINoteBookStop({ trunk }));
        app.use(express.static(__dirname + '/../../frontend'));
        const httpServer = http.createServer(app);
        yield new Promise(resolve => {
            httpServer.listen(port, bindaddress, () => {
                logger('Listening on port ' + trunk.get('port'));
                resolve();
            });
        });
        httpServer.on('close', () => __awaiter(this, void 0, void 0, function* () {
            yield trunk.get('notebookregistry').unmount();
        }));
        return httpServer;
    });
}
exports.app = app;
