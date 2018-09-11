const expect = require('chai').expect;
const { sanitizeParameters } = require('../../src/backend/app');
const { dirname, resolve } = require('path');

describe('sanitizeParameters()', function () {

    const missingNotebookError = '--notebooks path/to/notebooks is required';
    const nonexistingNotebookError = '--notebooks does not exist';
    const notDirectoryNotebookError = '--notebooks is not a directory';
    const invalidPortError = 'Invalid port';
    const outOfRangePortError = 'Port is out of range';
    const invalidBindAddressError = '--bindaddress is invalid';

    const someFilepath = __filename;
    const validDirpath = resolve(dirname(__filename) + '/../fixtures/notebooks');
    const validBindAddress = '0.0.0.0';

    const validRequiredParams = ['--notebooks', validDirpath];

    // Defaults

    it('should bind to 127.0.0.1 by default', async () => {
        const rawargv = [...validRequiredParams];
        expect(await sanitizeParameters(rawargv)).to.contain({
            bindaddress: '127.0.0.1',
        });
    });

    it('should listen port 8000 by default', async () => {
        const rawargv = [...validRequiredParams];
        expect(await sanitizeParameters(rawargv)).to.contain({
            port: 8000
        });
    });

    it('should not use docker default', async () => {
        const rawargv = [...validRequiredParams];
        expect(await sanitizeParameters(rawargv)).to.contain({
            docker: false
        });
    });

    // --notebooks

    it('should throw for missing --notebooks', () => {
        const rawargv = [];
        expect(sanitizeParameters(rawargv)).to.eventually.be.rejectedWith(missingNotebookError);
    });

    it('should throw for empty --notebooks', () => {
        const rawargv = ['--notebooks', ''];
        expect(sanitizeParameters(rawargv)).to.eventually.be.rejectedWith(missingNotebookError);
    });

    it('should throw for boolean --notebooks', () => {
        const rawargv = ['--notebooks'];
        expect(sanitizeParameters(rawargv)).to.eventually.be.rejectedWith(missingNotebookError);
    });

    it('should throw for non existing --notebooks', () => {
        const rawargv = ['--notebooks', '/' + Math.random()];
        expect(sanitizeParameters(rawargv)).to.eventually.be.rejectedWith(nonexistingNotebookError);
    });

    it('should throw if --notebooks is not a directory', () => {
        const rawargv = ['--notebooks', someFilepath];
        expect(sanitizeParameters(rawargv)).to.eventually.be.rejectedWith(notDirectoryNotebookError);
    });

    it('should pass for valid --notebooks', async () => {
        const rawargv = [...validRequiredParams];
        expect(await sanitizeParameters(rawargv)).to.contain({
            notebooks: validDirpath
        });
    });

    // --port

    it('should throw for invalid port', async () => {
        // Non numeric
        let rawargv = [...validRequiredParams, '--port', '123abcd'];
        expect(sanitizeParameters(rawargv)).to.eventually.be.rejectedWith(invalidPortError);

        // Contains non digit
        rawargv = [...validRequiredParams, '--port', '-50'];
        expect(sanitizeParameters(rawargv)).to.eventually.be.rejectedWith(invalidPortError);

        // Out of range
        rawargv = [...validRequiredParams, '--port', '0'];
        expect(sanitizeParameters(rawargv)).to.eventually.be.rejectedWith(outOfRangePortError);

        rawargv = [...validRequiredParams, '--port', '65536'];
        expect(sanitizeParameters(rawargv)).to.eventually.be.rejectedWith(outOfRangePortError);
    });

    it('should pass for valid port', async () => {
        let rawargv = [...validRequiredParams, '--port', '3000'];
        expect(await sanitizeParameters(rawargv)).to.contain({
            port: 3000
        });

        rawargv = [...validRequiredParams, '--port', '1'];
        expect(await sanitizeParameters(rawargv)).to.contain({
            port: 1
        });

        rawargv = [...validRequiredParams, '--port', '65535'];
        expect(await sanitizeParameters(rawargv)).to.contain({
            port: 65535
        });
    });

    // --bindaddress

    it('should throw for empty bind address', () => {
        let rawargv = [...validRequiredParams, '--bindaddress', ''];
        expect(sanitizeParameters(rawargv)).to.eventually.be.rejectedWith(invalidBindAddressError);
    });

    it('should pass for valid bind address', async () => {
        let rawargv = [...validRequiredParams, '--bindaddress', validBindAddress];
        expect(await sanitizeParameters(rawargv)).to.contain({
            bindaddress: validBindAddress,
        });
    });

    // --docker
    it('should enable docker with --docker', async () => {
        let rawargv = [...validRequiredParams, '--docker'];
        expect(await sanitizeParameters(rawargv)).to.contain({
            docker: true
        });
    });

    // Unknown parameters
    it('should throw for unknown parameters', () => {
        let rawargv = [...validRequiredParams, '--somethingunknown'];
        expect(sanitizeParameters(rawargv)).to.eventually.be.rejectedWith('Unknown parameter(s): somethingunknown');

        rawargv = [...validRequiredParams, '--somethingunknown', 'abcdef'];
        expect(sanitizeParameters(rawargv)).to.eventually.be.rejectedWith('Unknown parameter(s): somethingunknown');
    });

    // Unknown arguments
    it('should throw for unknown arguments', () => {
        let rawargv = [...validRequiredParams, 'abcdef'];
        expect(sanitizeParameters(rawargv)).to.eventually.be.rejectedWith('Unknown argument(s): abcdef');
    });
});