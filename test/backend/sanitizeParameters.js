const expect = require('chai').expect;
const { sanitizeParameters } = require('../../dist/nodejs/backend/sanitizeparameters');
const { dirname, resolve } = require('path');

describe('sanitizeParameters()', function () {

    const missingNotebookError = '--notebooks path/to/notebooks is required';
    const nonexistingNotebookError = 'Notebooks path does not exist';
    const notDirectoryNotebookError = 'Notebooks path is not a directory';
    const invalidPortError = 'Invalid port';
    const outOfRangePortError = 'Port is out of range';
    const invalidBindAddressError = '--bindaddress is invalid';

    const someFilepath = __filename;
    const validDirpath = resolve(dirname(__filename) + '/../fixtures/notebooks');
    const invalidDirPath = '/' + Math.random();
    const validBindAddress = '0.0.0.0';

    const validRequiredParams = ['--notebooks', validDirpath];
    const validRequiredArguments = [validDirpath];

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

    it('should throw for missing --notebooks', async () => {
        const rawargv = [];
        await expect(sanitizeParameters(rawargv)).to.eventually.be.rejectedWith(missingNotebookError);
    });

    it('should throw for empty --notebooks', async () => {
        const rawargv = ['--notebooks', ''];
        await expect(sanitizeParameters(rawargv)).to.eventually.be.rejectedWith(missingNotebookError);
    });

    it('should throw for boolean --notebooks', async () => {
        const rawargv = ['--notebooks'];
        await expect(sanitizeParameters(rawargv)).to.eventually.be.rejectedWith(missingNotebookError);
    });

    it('should throw for non existing --notebooks', async () => {
        const rawargv = ['--notebooks', invalidDirPath];
        await expect(sanitizeParameters(rawargv)).to.eventually.be.rejectedWith(nonexistingNotebookError);
    });

    it('should throw for invalid notebook path given as argument', async () => {
        const rawargv = [invalidDirPath];
        await expect(sanitizeParameters(rawargv)).to.eventually.be.rejectedWith(nonexistingNotebookError);
    });

    it('should throw if --notebooks is not a directory', async () => {
        const rawargv = ['--notebooks', someFilepath];
        await expect(sanitizeParameters(rawargv)).to.eventually.be.rejectedWith(notDirectoryNotebookError);
    });

    it('should pass for valid --notebooks', async () => {
        const rawargv = [...validRequiredParams];
        expect(await sanitizeParameters(rawargv)).to.contain({
            notebooks: validDirpath
        });
    });

    it('should pass for valid notebooks given as argument', async () => {
        const rawargv = [...validRequiredArguments];
        expect(await sanitizeParameters(rawargv)).to.contain({
            notebooks: validDirpath
        });
    });

    it('should throw if the notebook path is both given as an argument and a parameter', async () => {
        const rawargv = [...validRequiredArguments, ...validRequiredParams];
        await expect(sanitizeParameters(rawargv)).to.eventually.be.rejectedWith('Unknown argument(s): ' + validDirpath);
    });

    // --port

    it('should throw for invalid port', async () => {
        // Non numeric
        let rawargv = [...validRequiredParams, '--port', '123abcd'];
        await expect(sanitizeParameters(rawargv)).to.eventually.be.rejectedWith(invalidPortError);

        // Contains non digit
        rawargv = [...validRequiredParams, '--port', '-50'];
        await expect(sanitizeParameters(rawargv)).to.eventually.be.rejectedWith(invalidPortError);

        // Out of range
        rawargv = [...validRequiredParams, '--port', '0'];
        await expect(sanitizeParameters(rawargv)).to.eventually.be.rejectedWith(outOfRangePortError);

        rawargv = [...validRequiredParams, '--port', '65536'];
        await expect(sanitizeParameters(rawargv)).to.eventually.be.rejectedWith(outOfRangePortError);
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

    it('should throw for empty bind address', async () => {
        let rawargv = [...validRequiredParams, '--bindaddress', ''];
        await expect(sanitizeParameters(rawargv)).to.eventually.be.rejectedWith(invalidBindAddressError);
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
    it('should throw for unknown parameters', async () => {
        let rawargv = [...validRequiredParams, '--somethingunknown'];
        await expect(sanitizeParameters(rawargv)).to.eventually.be.rejectedWith('Unknown parameter(s): somethingunknown');

        rawargv = [...validRequiredParams, '--somethingunknown', 'abcdef'];
        await expect(sanitizeParameters(rawargv)).to.eventually.be.rejectedWith('Unknown parameter(s): somethingunknown');
    });

    // Unknown arguments
    it('should throw for unknown arguments', async () => {
        let rawargv = [...validRequiredParams, 'abcdef'];
        await expect(sanitizeParameters(rawargv)).to.eventually.be.rejectedWith('Unknown argument(s): abcdef');
    });
});