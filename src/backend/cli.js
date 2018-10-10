const { exec } = require('child_process');
const { Trunk } = require('trunk');

const parseArgs = require('minimist');
const fs = require('fs');
const { resolve: resolvePath } = require('path');
const chalk = require('chalk');

const NotebookRegistry = require('./services/notebookregistry');
const RecipeRegistry = require('./services/reciperegistry');

const { execNotebook } = require('./notebook');

(async function() {

    let parameters;
    try {
        parameters = await sanitizeParameters(process.argv.slice(2));
    } catch (e) {
        return console.error(e.message);
    }

    if (parameters.docker && !await isDockerRunning()) {
        throw new Error('docker is not running on the host, but --docker requested.')
    }

    try {
        await cli({
            notebookspath: parameters.notebooks,
            logger: console.log,
            docker: parameters.docker,
        });
    } catch(e) {
        logger(e.toString());
    }
    
})();

function isDockerRunning() {
    return new Promise(resolve => {
        exec('docker ps', err => resolve(err === null));
    });
};

async function cli({ notebookspath, logger, docker }) {

    process.chdir(notebookspath);

    const trunk = new Trunk();
    trunk
        .add('notebookspath', () => notebookspath)
        .add('docker', () => docker)
        .add('logger', () => logger)
        .add('reciperegistry', () => new RecipeRegistry())
        .add('notebookregistry', ['notebookspath', 'reciperegistry'], async (notebookspath, reciperegistry) => {
            const notebookregistry = new NotebookRegistry(notebookspath, reciperegistry, (notebook) => onNotebookChange(trunk, notebook));
            await notebookregistry.mount();
            return notebookregistry;
        });

    await trunk.open();
}

async function onNotebookChange(trunk, notebook) {
    console.log('CHANGE', notebook);

    const docker = trunk.get('docker');
    const notebookregistry = trunk.get('notebookregistry');

    const res = {
        writable: true,
        finished: false,
        write: str => {
            const data = JSON.parse(str);
            const msg = JSON.parse(data.data);
            switch(data.chan) {
                case 'stdout': {
                    process.stdout.write(msg);
                    break;
                }
                case 'stderr': {
                    process.stderr.write(chalk.red(msg));
                    break;
                }
                case 'info': {
                    process.stdout.write(chalk.cyan(msg));
                    break;
                }
            }
        }
    };

    const { start, stop } = await execNotebook(notebook, docker, res);
    await start();
}

async function sanitizeParameters(rawargv) {
    const argv = parseArgs(rawargv, {
        boolean: 'docker',
        string: ['notebooks'],
    });

    // --docker

    const docker = argv.docker;

    // --notebooks
    let notebooks;
    if (!("notebooks" in argv) || typeof argv.notebooks !== "string" || argv.notebooks.trim() === '') {
        if (argv['_'].length > 0) {
            notebooks = argv['_'].shift().trim();
        } else {
            throw new Error("--notebooks path/to/notebooks is required if path not provided as argument.");
        }
    } else {
        notebooks = argv.notebooks;
    }

    notebooks = resolvePath(notebooks);

    if (!fs.existsSync(notebooks)) {
        throw new Error("Notebooks path does not exist.");
    }

    if (!fs.statSync(notebooks).isDirectory()) {
        throw new Error("Notebooks path is not a directory.");
    }

    // Check for unknown parameters

    if (argv['_'].length > 0) {
        // ex: node . "abcdef"
        throw new Error("Unknown argument(s): " + argv['_'].join(', '));
    }

    const known = ['notebooks', 'docker'];
    const unknown = Object.keys(argv).filter((key, _) => key !== '_' && !known.includes(key));
    if (unknown.length > 0) {
        throw new Error("Unknown parameter(s): " + unknown.join(', '));
    }

    return { notebooks, docker };
}
