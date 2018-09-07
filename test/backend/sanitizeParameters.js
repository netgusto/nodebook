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

    it('should bind to 127.0.0.1 by default', function () {
        const rawargv = [...validRequiredParams];
        expect(sanitizeParameters(rawargv)).to.contain({
            bindaddress: '127.0.0.1',
        });
    });

    it('should listen port 8000 by default', function () {
        const rawargv = [...validRequiredParams];
        expect(sanitizeParameters(rawargv)).to.contain({
            port: 8000
        });
    });

    it('should not use docker default', function () {
        const rawargv = [...validRequiredParams];
        expect(sanitizeParameters(rawargv)).to.contain({
            docker: false
        });
    });

    // --notebooks

    it('should throw for missing --notebooks', function () {
        const rawargv = [];
        expect(() => sanitizeParameters(rawargv)).to.throw(missingNotebookError);
    });

    it('should throw for empty --notebooks', function () {
        const rawargv = ['--notebooks', ''];
        expect(() => sanitizeParameters(rawargv)).to.throw(missingNotebookError);
    });

    it('should throw for boolean --notebooks', function () {
        const rawargv = ['--notebooks'];
        expect(() => sanitizeParameters(rawargv)).to.throw(missingNotebookError);
    });

    it('should throw for non existing --notebooks', function () {
        const rawargv = ['--notebooks', '/' + Math.random()];
        expect(() => sanitizeParameters(rawargv)).to.throw(nonexistingNotebookError);
    });

    it('should throw if --notebooks is not a directory', function () {
        const rawargv = ['--notebooks', someFilepath];
        expect(() => sanitizeParameters(rawargv)).to.throw(notDirectoryNotebookError);
    });

    it('should pass for valid --notebooks', function () {
        const rawargv = [...validRequiredParams];
        expect(sanitizeParameters(rawargv)).to.contain({
            notebooks: validDirpath
        });
    });

    // --port

    it('should throw for invalid port', function () {
        // Non numeric
        let rawargv = [...validRequiredParams, '--port', '123abcd'];
        expect(() => sanitizeParameters(rawargv)).to.throw(invalidPortError);

        // Contains non digit
        rawargv = [...validRequiredParams, '--port', '-50'];
        expect(() => sanitizeParameters(rawargv)).to.throw(invalidPortError);

        // Out of range
        rawargv = [...validRequiredParams, '--port', '0'];
        expect(() => sanitizeParameters(rawargv)).to.throw(outOfRangePortError);

        rawargv = [...validRequiredParams, '--port', '65536'];
        expect(() => sanitizeParameters(rawargv)).to.throw(outOfRangePortError);
    });

    it('should pass for valid port', function () {
        let rawargv = [...validRequiredParams, '--port', '3000'];
        expect(sanitizeParameters(rawargv)).to.contain({
            port: 3000
        });

        rawargv = [...validRequiredParams, '--port', '1'];
        expect(sanitizeParameters(rawargv)).to.contain({
            port: 1
        });

        rawargv = [...validRequiredParams, '--port', '65535'];
        expect(sanitizeParameters(rawargv)).to.contain({
            port: 65535
        });
    });

    // --bindaddress

    it('should throw for empty bind address', function () {
        let rawargv = [...validRequiredParams, '--bindaddress', ''];
        expect(() => sanitizeParameters(rawargv)).to.throw(invalidBindAddressError);
    });

    it('should pass for valid bind address', function () {
        let rawargv = [...validRequiredParams, '--bindaddress', validBindAddress];
        expect(sanitizeParameters(rawargv)).to.contain({
            bindaddress: validBindAddress,
        });
    });

    // --docker
    it('should enable docker with --docker', function () {
        let rawargv = [...validRequiredParams, '--docker'];
        expect(sanitizeParameters(rawargv)).to.contain({
            docker: true
        });
    });

    // Unknown parameters
    it('should throw for unknown parameters', function () {
        let rawargv = [...validRequiredParams, '--somethingunknown'];
        expect(() => sanitizeParameters(rawargv)).to.throw('Unknown parameter(s): somethingunknown');

        rawargv = [...validRequiredParams, '--somethingunknown', 'abcdef'];
        expect(() => sanitizeParameters(rawargv)).to.throw('Unknown parameter(s): somethingunknown');
    });

    // Unknown arguments
    it('should throw for unknown arguments', function () {
        let rawargv = [...validRequiredParams, 'abcdef'];
        expect(() => sanitizeParameters(rawargv)).to.throw('Unknown argument(s): abcdef');
    });
});