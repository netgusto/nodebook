const chai = require('chai');
const chaiAsPromised = require("chai-as-promised");
const { dirname, resolve } = require('path');

const { listNotebooks, getFileContent } = require('../../src/backend/notebook');

const { expect } = chai;
chai.use(chaiAsPromised);

describe('notebook functions', function () {

    const validNotebook = 'My first notebook';
    const validDirpath = resolve(dirname(__filename) + '/../fixtures/notebooks');
    const validNotebookPath = validDirpath + '/' + validNotebook;
    const validNotebookFilePath = validNotebookPath + '/index.js';

    it('should list notebooks', function () {
        return expect(listNotebooks(validDirpath).then(map => {
            const res = {};
            map.forEach((value, key) => {
                res[key] = value;
                res[key].recipe.execDocker = undefined;
                res[key].recipe.execLocal = undefined;
            });
            return res;
        }))
            .to.eventually.deep.include({
                'My first notebook': {
                    name: validNotebook,
                    mainfilename: 'index.js',
                    absdir: validNotebookPath,
                    abspath: validNotebookFilePath,
                    recipe: {
                        key: "nodejs",
                        name: "NodeJS",
                        language: "JavaScript",
                        mainfile: ["index.js"],
                        execDocker: undefined,
                        execLocal: undefined,
                    },
                }
            });
    });

    it('should get notebook content', () => {
        return expect(getFileContent(validNotebookFilePath))
            .to.eventually.eq('console.log(\'OK\');');
    });
});