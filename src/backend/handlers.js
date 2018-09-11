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
} = require('./notebook');

const { buildUrl } = require('./buildurl');

const { getRecipes, getRecipeByKey } = require('./recipes');

module.exports = {
    handleHomePage,
    handleNoteBook,
    handleAPINoteBookSetContent,
    handleAPINoteBookExec,
    handleAPINoteBookNew,
};

function generatePageHtml(route, params = {}) {
    return getFileContent(path.resolve(__dirname + '/../../dist/index.html'))
        .then(html => {
            return html
                .replace(/"#route#"/g, JSON.stringify(route))
                .replace(/"#params#"/g, JSON.stringify(params));
        });
}

function handleHomePage({ notebookspath }) {
    return async function (req, res) {
        const notebooks = await listNotebooks(notebookspath);
        const recipes = await getRecipes();

        const data = [];
        notebooks.forEach((notebook) => data.push(extractFrontendNotebookSummary(notebook)));

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
        const homeurl = buildUrl('home');

        res.send(await generatePageHtml("notebook", {
            homeurl,
            notebook: {
                ...extractFrontendNotebookSummary(notebook),
                execurl,
                persisturl,
                content: await getFileContent(notebook.abspath),
            }
        }));
    };
}

function handleAPINoteBookSetContent({ notebookspath }) {
    return async function (req, res) {
        const { name } = req.params;
        const { content } = req.body;

        if (content === undefined) return res.send('Notebook content not set on POST');
        const notebooks = await listNotebooks(notebookspath);

        if (!notebooks.has(name)) return res.send('Notebook not found');
        const notebook = notebooks.get(name);

        await setFileContent(notebook.abspath, content);
        res.set('Content-Type', 'application/json');
        res.send('"OK"');
    };
}

function handleAPINoteBookExec({ notebookspath, docker }) {
    return async function (req, res) {
        const { name } = req.params;

        res.set('Content-Type', 'text/plain');

        const notebooks = await listNotebooks(notebookspath);

        if (!notebooks.has(name)) return res.send('Notebook not found');
        const notebook = notebooks.get(name);
        const execCommand = notebook.recipe[docker ? 'execDocker' : 'execLocal'];

        await execNotebook(notebook, execCommand, res);
        res.end();
    };
}

function handleAPINoteBookNew({ notebookspath, defaultcontentsdir }) {

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

        const done = await newNotebook(notebookspath, name, recipe, defaultcontentsdir);
        if (!done) {
            return res.status(400).send('Notebook initialization failed');
        }

        const notebooks = await listNotebooks(notebookspath);
        if (!notebooks.has(name)) {
            return res.status(400).send('Notebook initialization failed');
        }

        const notebook = notebooks.get(name);

        res.set('Content-Type', 'application/json');
        res.send(JSON.stringify(extractFrontendNotebookSummary(notebook)));
    };
}