const minimist = require('minimist');
const fs = require('fs');
const { resolve: resolvePath } = require('path');

module.exports = {
    sanitizeParameters,
};

async function sanitizeParameters(rawargv) {
    const argv = minimist(rawargv);

    // --port

    let port = 8000;
    if ('port' in argv) {
        if (!argv.port.toString().match(/^\d+$/g)) {
            throw new Error("Invalid port");
        }

        port = parseInt(argv.port, 10);
        if (port <= 0 || port > 65535) {
            throw new Error("Port is out of range");
        }
    }

    // --bindaddress

    let bindaddress = '127.0.0.1';
    if ('bindaddress' in argv) {
        bindaddress = argv.bindaddress.toString();
    }

    if (bindaddress.trim() === '') {
        throw new Error('--bindaddress is invalid.')
    }

    // --docker

    const docker = ("docker" in argv);

    // --notebooks

    if (!("notebooks" in argv) || typeof argv.notebooks !== "string" || argv.notebooks.trim() === '') throw new Error("--notebooks path/to/notebooks is required.");
    const notebooks = resolvePath(argv.notebooks);

    if (!fs.existsSync(notebooks)) {
        throw new Error("--notebooks does not exist.");
    }

    if (!fs.statSync(notebooks).isDirectory()) {
        throw new Error("--notebooks is not a directory.");
    }

    // Check for unknown parameters

    if (argv['_'].length > 0) {
        // ex: node . "abcdef"
        throw new Error("Unknown argument(s): " + argv['_'].join(', '));
    }

    const known = ['notebooks', 'port', 'bindaddress', 'docker'];
    const unknown = Object.keys(argv).filter((key, _) => key !== '_' && !known.includes(key));
    if (unknown.length > 0) {
        throw new Error("Unknown parameter(s): " + unknown.join(', '));
    }

    return { notebooks, port, bindaddress, docker };
}
