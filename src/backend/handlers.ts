import * as path from 'path';
import * as generateName from 'project-name-generator';
const titleCase = require('title-case');

import {
    listNotebooks,
    getFileContent,
    execNotebook,
    updateNotebookContent,
    newNotebook,
    extractFrontendNotebookSummary,
    extractFrontendRecipeSummary,
    sanitizeNotebookName,
    renameNotebook,
} from './notebook';

import { buildUrl } from './buildurl';

export {
    handleHomePage,
    handleNoteBook,
    handleAPINoteBookSetContent,
    handleAPINoteBookExec,
    handleAPINoteBookStop,
    handleAPINoteBookNew,
    handleAPINoteBookRename,
};

function setNoCache(res) {
    res.set('Cache-Control', 'max-age=0');
}

function generatePageHtml(route, params = {}) {
    return getFileContent(path.resolve(__dirname + '/../../frontend/index.html'))
        .then(html => {
            return html
                .replace(/"#route#"/g, JSON.stringify(route))
                .replace(/"#params#"/g, JSON.stringify(params));
        });
}

function handleHomePage({ trunk }) {
    return async function (_, res) {
        const reciperegistry = trunk.get('reciperegistry');
        const notebookregistry = trunk.get('notebookregistry');

        const notebooks = await listNotebooks({ notebookregistry });
        const recipes = reciperegistry.getRecipes();

        const data = [];
        notebooks.forEach((notebook) => data.push(extractFrontendNotebookSummary(notebook)));

        res.set('Content-Type', 'text/html');
        setNoCache(res);
        res.send(await generatePageHtml("home", {
            newnotebookurl: buildUrl('notebooknew'),
            notebooks: data,
            recipes: recipes.map(extractFrontendRecipeSummary),
        }));
    };
}

function handleNoteBook({ trunk }) {
    return async function (req, res) {
        const notebookregistry = trunk.get('notebookregistry');

        const { name } = req.params;
        const notebook = notebookregistry.getNotebookByName(name);
        if (!notebook) return res.send('Notebook not found');

        const persisturl = buildUrl('notebooksetcontent', { name });
        const execurl = buildUrl('notebookexec', { name });
        const stopurl = buildUrl('notebookstop', { name });
        const renamenotebookurl = buildUrl('notebookrename', { name });
        const homeurl = buildUrl('home');

        res.set('Content-Type', 'text/html');
        setNoCache(res);

        const notebookinfo = Object.assign({},
            extractFrontendNotebookSummary(notebook),
            {
                execurl,
                stopurl,
                persisturl,
                content: await getFileContent(notebook.abspath),
            }
        );

        res.send(await generatePageHtml("notebook", {
            homeurl,
            renamenotebookurl,
            notebook: notebookinfo,
        }));
    };
}

function handleAPINoteBookSetContent({ trunk }) {
    return async function (req, res) {
        const notebookregistry = trunk.get('notebookregistry');

        const { name } = req.params;
        const { content } = req.body;

        if (content === undefined) return res.status(400).send('Notebook content not set on POST');

        const notebook = notebookregistry.getNotebookByName(name);
        if (!notebook) return res.status(400).send('Notebook not found');

        const success = await updateNotebookContent(notebook, content, notebookregistry);
        if (!success) return res.status(400).send('Could not update notebook content');

        res.set('Content-Type', 'application/json');
        setNoCache(res);
        res.send('"OK"');
    };
}

let running = [];

function handleAPINoteBookExec({ trunk }) {
    return async function (req, res) {
        const docker = trunk.get('docker');
        const notebookregistry = trunk.get('notebookregistry');

        const { name } = req.params;

        res.set('Content-Type', 'text/plain');

        const notebook = notebookregistry.getNotebookByName(name);
        if (!notebook) return res.status(400).send('Notebook not found');

        setNoCache(res);
        const { start, stop } = await execNotebook(notebook, docker, res);

        running.push(stop);
        await start();

        res.end();
    };
}

function handleAPINoteBookStop({ trunk }) {
    return async function (req, res) {
        const notebookregistry = trunk.get('notebookregistry');

        const { name } = req.params;

        res.set('Content-Type', 'text/plain');

        const notebook = notebookregistry.getNotebookByName(name);
        if (!notebook) return res.status(400).send('Notebook not found');

        running.map(async stop => await stop());
        running = [];

        res.end();
    };
}

function handleAPINoteBookNew({ trunk }) {
    return async function (req, res) {
        const notebookspath = trunk.get('notebookspath');
        const notebookregistry = trunk.get('notebookregistry');
        const reciperegistry = trunk.get('reciperegistry');

        const { recipekey } = req.body;
        res.set('Content-Type', 'text/plain');

        // find recipe
        const recipe = reciperegistry.getRecipeByKey(recipekey);
        if (recipe === undefined) {
            return res.status(400).send('Recipe does not exist');
        }

        // Generate name
        let name;
        do {
            name = sanitizeNotebookName(titleCase(generateName().spaced));
        } while (notebookregistry.getNotebookByName(name));

        let done;
        try {
            done = await newNotebook(notebookspath, name, recipe, notebookregistry);
        } catch(e) {
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
        res.send(JSON.stringify(extractFrontendNotebookSummary(notebook)));
    };
}

function handleAPINoteBookRename({ trunk }) {
    return async function (req, res) {
        const notebookregistry = trunk.get('notebookregistry');

        const { name: oldname } = req.params;
        const { newname } = req.body;

        res.set('Content-Type', 'text/plain');

        // Generate name
        const notebook = notebookregistry.getNotebookByName(oldname);
        if (!notebook) {
            return res.status(400).send('Notebook does not exist.');
        }

        // Sanitize new name
        let sanitizedNewName;
        try {
            sanitizedNewName = sanitizeNotebookName(newname);
        } catch(e) {
            return res.status(400).send('Invalid Notebook name.');
        }
        
        let done;
        try {
            done = await renameNotebook(notebook, sanitizedNewName, notebookregistry);
        } catch(e) {
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
        res.send(JSON.stringify(extractFrontendNotebookSummary(notebookRenamed)));
    };
}