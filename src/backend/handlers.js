const { listNotebooks, getFileContent, setFileContent, execNotebook } = require('./notebook');
const { buildUrl } = require('./buildurl');
const path = require('path');

module.exports = {
    handleHomePage,
    handleNoteBook,
    handleAPINoteBookSetContent,
    handleAPINoteBookExec,
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
        const data = [];
        notebooks.forEach((notebook) => data.push({
            name: notebook.name,
            url: buildUrl("notebook", { name: notebook.name })
        }));

        res.send(await generatePageHtml("home", { notebooks: data }));
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
                ...notebook,
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

function handleAPINoteBookExec({ notebookspath, execCommand }) {
    return async function (req, res) {
        const { name } = req.params;

        const notebooks = await listNotebooks(notebookspath);

        if (!notebooks.has(name)) return res.send('Notebook not found');
        const notebook = notebooks.get(name);

        res.set('Content-Type', 'text/plain');
        await execNotebook(notebook, execCommand, res);
        res.end();
    };
}