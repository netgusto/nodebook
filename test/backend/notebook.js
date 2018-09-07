const chai = require('chai');
const chaiAsPromised = require("chai-as-promised");
const { sanitizeParameters } = require('../../src/backend/app');
const { dirname, resolve } = require('path');

const { listNotebooks,
getFileContent,
setFileContent,
execNotebook } = require('../../src/backend/notebook');

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
            map.forEach((value, key) => res[key] = value);
            return res;
        }))
            .to.eventually.deep.include({
                'My first notebook': {
                    name: validNotebook,
                    absdir: validNotebookPath,
                    abspath: validNotebookFilePath,
                }
            });
    });

    it('should get notebook content', () => {
        return expect(getFileContent(validNotebookFilePath))
            .to.eventually.eq('console.log(\'OK\');');
    });
});