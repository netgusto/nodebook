const { listNotebooks, getFileContent, setFileContent, execNotebook } = require('./notebook');
const { renderHomePage, renderNotebook } = require('./render');

module.exports = { handleHomePage, handleNoteBook, handleNoteBookSetContent, handleNoteBookExec };

function handleHomePage({ notebookspath }) {
    return async function (req, res) {
        const notebooks = await listNotebooks(notebookspath);
        res.send(renderHomePage({
            notebooks
        }));
    };
}

function handleNoteBook({ notebookspath }) {
    return async function (req, res) {
        const { name } = req.params;
        const notebooks = await listNotebooks(notebookspath);

        if (!notebooks.has(name)) return res.send('Notebook not found');
        const notebook = notebooks.get(name);

        res.send(renderNotebook({
            ...notebook,
            content: await getFileContent(notebook.abspath),
        }));
    };
}

function handleNoteBookSetContent({ notebookspath }) {
    return async function (req, res) {
        const { name } = req.params;
        const { content } = req.body;

        if (content === undefined) return res.send('Notebook content not set on POST');
        const notebooks = await listNotebooks(notebookspath);

        if (!notebooks.has(name)) return res.send('Notebook not found');
        const notebook = notebooks.get(name);

        const status = await setFileContent(notebook.abspath, content);

        res.send('"OK"');
    };
}

function handleNoteBookExec({ notebookspath, execCommand }) {
    return async function (req, res) {
        const { name } = req.params;

        const notebooks = await listNotebooks(notebookspath);

        if (!notebooks.has(name)) return res.send('Notebook not found');
        const notebook = notebooks.get(name);

        await execNotebook(notebook, execCommand, res);
        res.end();
        // res.send({ stdout, stderr });
    };
}