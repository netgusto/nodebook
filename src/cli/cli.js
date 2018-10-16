const { Trunk } = require('trunk');
const EventEmitter = require('events');

const NotebookRegistry = require('../backend/services/notebookregistry');
const RecipeRegistry = require('../backend/services/reciperegistry');

const { writeInfoLn } = require('./write');
const { onNotebookChange, withProcessQueue, withSameNotebookChangeThrottle } = require('./onchange');

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

                const change = withSameNotebookChangeThrottle(
                    withProcessQueue(
                        (notebook) => onNotebookChange(notebook, docker, eventbus),
                    ),
                    200,
                );

                const notebookregistry = new NotebookRegistry(
                    notebookspath,
                    reciperegistry,
                    change,
                );
                await notebookregistry.mount();
                return notebookregistry;
            }
        );

    await trunk.open();

    const registry = trunk.get('notebookregistry');

    const nbnotebooks = registry.getNotebooks().length;
    if (nbnotebooks) {
        writeInfoLn("Nodebook started. " + nbnotebooks + " notebook" + (nbnotebooks > 1 ? 's' : '') + " watched in " + notebookspath);
    } else {
        writeInfoLn("Nodebook started. No notebook yet in " + notebookspath);
    }
}
