const chai = require('chai');
const chaiAsPromised = require("chai-as-promised");
const { dirname, resolve } = require('path');
const { Trunk } = require('trunk');

const { listNotebooks, getFileContent } = require('../../dist/nodejs/backend/notebook');

const { default: NotebookRegistry } = require('../../dist/nodejs/backend/services/notebookregistry');
const { default: RecipeRegistry } = require('../../dist/nodejs/backend/services/reciperegistry');

const { expect } = chai;
chai.use(chaiAsPromised);

describe('notebook functions', function () {

    const validNotebook = 'Javascript';
    const validDirpath = resolve(dirname(__filename) + '/../fixtures/notebooks');
    const validNotebookPath = validDirpath + '/' + validNotebook;
    const validNotebookFilePath = validNotebookPath + '/index.js';

    let trunk;

    before(async () => {
        trunk = await getTrunk();
    });

    async function getTrunk() {
        const trunk = new Trunk();
        trunk
            .add('notebookspath', () => validDirpath)
            .add('reciperegistry', () => new RecipeRegistry())
            .add('notebookregistry', ['notebookspath', 'reciperegistry'], async (notebookspath, reciperegistry) => {
                const notebookregistry = new NotebookRegistry(notebookspath, reciperegistry);
                await notebookregistry.mount();
                return notebookregistry;
            });
        
        await trunk.open();

        return trunk;
    }

    it('should list notebooks', async () => {

        const notebookregistry = trunk.get('notebookregistry');
        const notebooks = await listNotebooks({ notebookregistry });
        const notebook = notebooks.has(validNotebook) ? notebooks.get(validNotebook) : undefined;

        expect(notebook).to.not.be.undefined;

        expect(notebook).to.contain({
            name: validNotebook,
            mainfilename: 'index.js',
            absdir: validNotebookPath,
            abspath: validNotebookFilePath,
        });

        expect(notebook.recipe).to.not.be.undefined;

        expect(notebook.recipe).to.deep.contain({
            key: "nodejs",
            name: "NodeJS",
            language: "JavaScript",
            cmmode: "javascript",
            mainfile: ["index.js", "main.js"],
        });
    });

    it('should not list notebooks at depth 0', async () => {

        const notebookregistry = trunk.get('notebookregistry');
        const notebooks = await listNotebooks({ notebookregistry });

        notebooks.forEach((notebook, key) => {
            expect(notebook.absdir).to.not.eq(validDirpath);
        });
    });

    it('should get notebook content', async () => {
        expect(await getFileContent(validNotebookFilePath))
            .to.eq('console.log(\'Hello, World!\');');
    });

    after(async () => {
        const notebookregistry = trunk.get('notebookregistry');
        await notebookregistry.unmount();
    });
});