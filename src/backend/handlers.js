const path = require('path');
const generateName = require('project-name-generator');
const titleCase = require('title-case');

const {
    listNotebooks,
    getFileContent,
    setFileContent,
    execNotebook,
    newNotebook,
    extractFrontendNotebookSummary,
    extractFrontendRecipeSummary,
    sanitizeNotebookName,
    renameNotebook,
} = require('./notebook');

const { buildUrl } = require('./buildurl');

const { getRecipes, getRecipeByKey } = require('./recipes');

module.exports = {
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
    return getFileContent(path.resolve(__dirname + '/../../dist/index.html'))
        .then(html => {
            return html
                .replace(/"#route#"/g, JSON.stringify(route))
                .replace(/"#params#"/g, JSON.stringify(params));
        });
}

function handleHomePage({ notebookspath }) {
    return async function (_, res) {
        const notebooks = await listNotebooks(notebookspath);
        const recipes = await getRecipes();

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

function handleNoteBook({ notebookspath }) {
    return async function (req, res) {
        const { name } = req.params;
        const notebooks = await listNotebooks(notebookspath);

        if (!notebooks.has(name)) return res.send('Notebook not found');
        const notebook = notebooks.get(name);

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

function handleAPINoteBookSetContent({ notebookspath }) {
    return async function (req, res) {
        const { name } = req.params;
        const { content } = req.body;

        if (content === undefined) return res.status(400).send('Notebook content not set on POST');
        const notebooks = await listNotebooks(notebookspath);

        if (!notebooks.has(name)) return res.status(400).send('Notebook not found');
        const notebook = notebooks.get(name);

        await setFileContent(notebook.abspath, content);
        res.set('Content-Type', 'application/json');
        setNoCache(res);
        res.send('"OK"');
    };
}

let running = [];

function handleAPINoteBookExec({ notebookspath, docker }) {
    return async function (req, res) {
        const { name } = req.params;

        res.set('Content-Type', 'text/plain');

        const notebooks = await listNotebooks(notebookspath);

        if (!notebooks.has(name)) return res.status(400).send('Notebook not found');
        const notebook = notebooks.get(name);

        setNoCache(res);
        const { start, stop } = await execNotebook(notebook, docker, res);

        running.push(stop);
        await start();

        res.end();
    };
}

function handleAPINoteBookStop({ notebookspath, docker }) {
    return async function (req, res) {
        const { name } = req.params;

        res.set('Content-Type', 'text/plain');

        const notebooks = await listNotebooks(notebookspath);
        if (!notebooks.has(name)) return res.status(400).send('Notebook not found');

        running.map(async stop => await stop());
        running = [];

        res.end();
    };
}

function handleAPINoteBookNew({ notebookspath }) {
    return async function (req, res) {
        const { recipekey } = req.body;
        res.set('Content-Type', 'text/plain');

        // find recipe
        const recipe = getRecipeByKey(recipekey);
        if (recipe === undefined) {
            return res.status(400).send('Recipe does not exist');
        }

        // Generate name
        const notebooksBefore = await listNotebooks(notebookspath);
        let name;
        do {
            name = sanitizeNotebookName(titleCase(generateName().spaced));
        } while(notebooksBefore.has(name));

        let done;
        try {
            done = await newNotebook(notebookspath, name, recipe);
        } catch(e) {
            done = false;
        }

        if (!done) {
            return res.status(400).send('Notebook initialization failed');
        }

        const notebooks = await listNotebooks(notebookspath);
        if (!notebooks.has(name)) {
            return res.status(400).send('Notebook initialization failed');
        }

        const notebook = notebooks.get(name);

        res.set('Content-Type', 'application/json');
        setNoCache(res);
        res.send(JSON.stringify(extractFrontendNotebookSummary(notebook)));
    };
}

function handleAPINoteBookRename({ notebookspath }) {
    return async function (req, res) {
        const { name: oldname } = req.params;
        const { newname } = req.body;

        res.set('Content-Type', 'text/plain');

        // Generate name
        const notebooks = await listNotebooks(notebookspath);
        if (!notebooks.has(oldname)) {
            return res.status(400).send('Notebook does not exist.');
        }

        const notebook = notebooks.get(oldname);

        // Sanitize new name
        let sanitizedNewName;
        try {
            sanitizedNewName = sanitizeNotebookName(newname);
        } catch(e) {
            return res.status(400).send('Invalid Notebook name.');
        }
        
        let done;
        try {
            done = await renameNotebook(notebook, sanitizedNewName);
        } catch(e) {
            console.log(e);
            done = false;
        }

        if (!done) {
            return res.status(400).send('Notebook rename failed');
        }

        const notebooksAfter = await listNotebooks(notebookspath);
        if (!notebooksAfter.has(sanitizedNewName)) {
            return res.status(400).send('Notebook rename failed');
        }

        const notebookRenamed = notebooksAfter.get(sanitizedNewName);

        res.set('Content-Type', 'application/json');
        setNoCache(res);
        res.send(JSON.stringify(extractFrontendNotebookSummary(notebookRenamed)));
    };
}