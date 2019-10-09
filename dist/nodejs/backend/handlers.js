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
const crypto = require("crypto");
const path = require("path");
const generateName = require("project-name-generator");
const titleCase = require('title-case');
const notebook_1 = require("./notebook");
const buildurl_1 = require("./buildurl");
function setNoCache(res) {
    res.set('Cache-Control', 'max-age=0');
}
function generatePageHtml(route, params = {}) {
    return notebook_1.getFileContent(path.resolve(__dirname + '/../../frontend/index.html'))
        .then(html => {
        return html
            .replace(/"#route#"/g, JSON.stringify(route))
            .replace(/"#params#"/g, JSON.stringify(params));
    });
}
function handleCsrf({ trunk }) {
    return function (_, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const csrfToken = crypto.randomBytes(32).toString('hex');
            trunk.get('validtokens').add(csrfToken);
            res.set('Content-Type', 'application/json');
            setNoCache(res);
            res.send(JSON.stringify({ csrfToken }));
        });
    };
}
exports.handleCsrf = handleCsrf;
function handleHomePage({ trunk }) {
    return function (_, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const reciperegistry = trunk.get('reciperegistry');
            const notebookregistry = trunk.get('notebookregistry');
            const notebooks = yield notebook_1.listNotebooks({ notebookregistry });
            const recipes = reciperegistry.getRecipes();
            const data = [];
            notebooks.forEach((notebook) => data.push(notebook_1.extractFrontendNotebookSummary(notebook)));
            res.set('Content-Type', 'text/html');
            setNoCache(res);
            res.send(yield generatePageHtml("home", {
                newnotebookurl: buildurl_1.buildUrl('notebooknew'),
                notebooks: data,
                recipes: recipes.map(notebook_1.extractFrontendRecipeSummary),
            }));
        });
    };
}
exports.handleHomePage = handleHomePage;
function handleNoteBook({ trunk }) {
    return function (req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const notebookregistry = trunk.get('notebookregistry');
            const { name } = req.params;
            const notebook = notebookregistry.getNotebookByName(name);
            if (!notebook)
                return res.send('Notebook not found');
            const persisturl = buildurl_1.buildUrl('notebooksetcontent', { name });
            const execurl = buildurl_1.buildUrl('notebookexec', { name });
            const stopurl = buildurl_1.buildUrl('notebookstop', { name });
            const renamenotebookurl = buildurl_1.buildUrl('notebookrename', { name });
            const homeurl = buildurl_1.buildUrl('home');
            res.set('Content-Type', 'text/html');
            setNoCache(res);
            const notebookinfo = Object.assign({}, notebook_1.extractFrontendNotebookSummary(notebook), {
                execurl,
                stopurl,
                persisturl,
                content: yield notebook_1.getFileContent(notebook.abspath),
            });
            res.send(yield generatePageHtml("notebook", {
                homeurl,
                renamenotebookurl,
                notebook: notebookinfo,
            }));
        });
    };
}
exports.handleNoteBook = handleNoteBook;
function handleAPINoteBookSetContent({ trunk }) {
    return function (req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const notebookregistry = trunk.get('notebookregistry');
            const validtokens = trunk.get('validtokens');
            const { name } = req.params;
            const { content, csrfToken } = req.body;
            if (!csrfToken || !validtokens.has(csrfToken))
                return res.status(401).send('Unauthorized request');
            if (content === undefined)
                return res.status(400).send('Notebook content not set on POST');
            const notebook = notebookregistry.getNotebookByName(name);
            if (!notebook)
                return res.status(400).send('Notebook not found');
            const success = yield notebook_1.updateNotebookContent(notebook, content, notebookregistry);
            if (!success)
                return res.status(400).send('Could not update notebook content');
            res.set('Content-Type', 'application/json');
            setNoCache(res);
            res.send('"OK"');
        });
    };
}
exports.handleAPINoteBookSetContent = handleAPINoteBookSetContent;
let running = [];
function handleAPINoteBookExec({ trunk }) {
    return function (req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const docker = trunk.get('docker');
            const notebookregistry = trunk.get('notebookregistry');
            const validtokens = trunk.get('validtokens');
            const { name } = req.params;
            const { csrfToken } = req.body;
            if (!csrfToken || !validtokens.has(csrfToken))
                return res.status(401).send('Unauthorized request');
            res.set('Content-Type', 'text/plain');
            const notebook = notebookregistry.getNotebookByName(name);
            if (!notebook)
                return res.status(400).send('Notebook not found');
            setNoCache(res);
            const { start, stop } = yield notebook_1.execNotebook(notebook, docker, res);
            running.push(stop);
            yield start();
            res.end();
        });
    };
}
exports.handleAPINoteBookExec = handleAPINoteBookExec;
function handleAPINoteBookStop({ trunk }) {
    return function (req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const notebookregistry = trunk.get('notebookregistry');
            const validtokens = trunk.get('validtokens');
            const { name } = req.params;
            const { csrfToken } = req.body;
            if (!csrfToken || !validtokens.has(csrfToken))
                return res.status(401).send('Unauthorized request');
            res.set('Content-Type', 'text/plain');
            const notebook = notebookregistry.getNotebookByName(name);
            if (!notebook)
                return res.status(400).send('Notebook not found');
            running.map((stop) => __awaiter(this, void 0, void 0, function* () { return yield stop(); }));
            running = [];
            res.end();
        });
    };
}
exports.handleAPINoteBookStop = handleAPINoteBookStop;
function handleAPINoteBookNew({ trunk }) {
    return function (req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const notebookspath = trunk.get('notebookspath');
            const notebookregistry = trunk.get('notebookregistry');
            const reciperegistry = trunk.get('reciperegistry');
            const validtokens = trunk.get('validtokens');
            const { recipekey, csrfToken } = req.body;
            if (!csrfToken || !validtokens.has(csrfToken))
                return res.status(401).send('Unauthorized request');
            res.set('Content-Type', 'text/plain');
            // find recipe
            const recipe = reciperegistry.getRecipeByKey(recipekey);
            if (recipe === undefined) {
                return res.status(400).send('Recipe does not exist');
            }
            // Generate name
            let name;
            do {
                name = notebook_1.sanitizeNotebookName(titleCase(generateName().spaced));
            } while (notebookregistry.getNotebookByName(name));
            let done;
            try {
                done = yield notebook_1.newNotebook(notebookspath, name, recipe, notebookregistry);
            }
            catch (e) {
                console.log(e);
                done = false;
            }
            if (!done) {
                return res.status(400).send('Notebook initialization failed');
            }
            const notebook = notebookregistry.getNotebookByName(name);
            if (!notebook) {
                return res.status(400).send('Notebook initialization failed2');
            }
            res.set('Content-Type', 'application/json');
            setNoCache(res);
            res.send(JSON.stringify(notebook_1.extractFrontendNotebookSummary(notebook)));
        });
    };
}
exports.handleAPINoteBookNew = handleAPINoteBookNew;
function handleAPINoteBookRename({ trunk }) {
    return function (req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const notebookregistry = trunk.get('notebookregistry');
            const validtokens = trunk.get('validtokens');
            const { name: oldname } = req.params;
            const { newname, csrfToken } = req.body;
            if (!csrfToken || !validtokens.has(csrfToken))
                return res.status(401).send('Unauthorized request');
            res.set('Content-Type', 'text/plain');
            // Generate name
            const notebook = notebookregistry.getNotebookByName(oldname);
            if (!notebook) {
                return res.status(400).send('Notebook does not exist.');
            }
            // Sanitize new name
            let sanitizedNewName;
            try {
                sanitizedNewName = notebook_1.sanitizeNotebookName(newname);
            }
            catch (e) {
                return res.status(400).send('Invalid Notebook name.');
            }
            let done;
            try {
                done = yield notebook_1.renameNotebook(notebook, sanitizedNewName, notebookregistry);
            }
            catch (e) {
                console.log(e);
                done = false;
            }
            if (!done) {
                return res.status(400).send('Notebook rename failed');
            }
            const notebookRenamed = notebookregistry.getNotebookByName(sanitizedNewName);
            if (!notebookRenamed) {
                return res.status(400).send('Notebook rename failed');
            }
            res.set('Content-Type', 'application/json');
            setNoCache(res);
            res.send(JSON.stringify(notebook_1.extractFrontendNotebookSummary(notebookRenamed)));
        });
    };
}
exports.handleAPINoteBookRename = handleAPINoteBookRename;
