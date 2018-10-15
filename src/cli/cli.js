const { Trunk } = require('trunk');
const chalk = require('chalk');
const EventEmitter = require('events');
const { performance } = require('perf_hooks');

const NotebookRegistry = require('../backend/services/notebookregistry');
const RecipeRegistry = require('../backend/services/reciperegistry');

const { execNotebook } = require('../backend/notebook');

module.exports = async function cli({ notebookspath, logger, docker }) {

    process.chdir(notebookspath);

    const trunk = new Trunk();
    trunk
        .add('notebookspath', () => notebookspath)
        .add('docker', () => docker)
        .add('logger', () => logger)
        .add('reciperegistry', () => new RecipeRegistry())
        .add('eventbus', () => {
            const emitter = new EventEmitter();
            const sigIntHandler = () => {
                let cancelled = false;
                const cancel = () => cancelled = true;
                emitter.emit('SIGINT', cancel);
                if (!cancelled) {
                    process.exit(0);
                }
            };

            process.on('SIGINT', sigIntHandler);

            return emitter;
        })
        .add(
            'notebookregistry',
            ['docker', 'notebookspath', 'reciperegistry', 'eventbus'],
            async (docker, notebookspath, reciperegistry, eventbus) => {
                const notebookregistry = new NotebookRegistry(
                    notebookspath,
                    reciperegistry,
                    (notebook) => onNotebookChange(notebookregistry, docker, notebook, eventbus)
                );
                await notebookregistry.mount();
                return notebookregistry;
            }
        );

    await trunk.open();
}

function write(str) {
    const data = JSON.parse(str);
    const msg = JSON.parse(data.data);
    switch (data.chan) {
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

async function onNotebookChange(notebookregistry, docker, notebook, eventbus) {

    const starttime = performance.now();

    const res = {
        writable: true,
        finished: false,
        write,
    };

    const writeInfo = (msg) => write(JSON.stringify({ chan: 'info', data: JSON.stringify(msg) }));

    const label = notebook.name + ' (' + notebook.recipe.name + ')';

    writeInfo('>>> Executing: ' + label + '\n');

    const { start, stop } = await execNotebook(notebook, docker, res);
    let interrupted = false;
    const sigIntHandler = (preventDefault) => {
        preventDefault();
        writeInfo('>>> Stopping: ' + label + '\n');
        stop();
        writeInfo('>>> Stopped: ' + label + '\n');
        interrupted = true;
    };

    eventbus.on('SIGINT', sigIntHandler);
    await start();
    eventbus.removeListener('SIGINT', sigIntHandler);
    if (!interrupted) {
        writeInfo('>>> Done: ' + label + '; took ' + (performance.now() - starttime).toFixed(1) + 'ms\n');
    }  
}