import { Trunk } from 'trunk';
import * as Emitter from 'events';

import NotebookRegistry from '../backend/services/notebookregistry';
import RecipeRegistry from '../backend/services/reciperegistry';

import { writeInfoLn } from './write';
import { onNotebookChange, withProcessQueue, withSameNotebookChangeThrottle } from './onchange';

export default async function cli({ notebookspath, logger, docker }: { notebookspath: string, logger: any, docker: boolean }) {

    process.chdir(notebookspath);

    const trunk = new Trunk();
    trunk
        .add('notebookspath', () => notebookspath)
        .add('docker', () => docker)
        .add('logger', () => logger)
        .add('reciperegistry', () => new RecipeRegistry())
        .add('eventbus', () => {
            const emitter = new Emitter();
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
            async (docker: boolean, notebookspath: string, reciperegistry: any, eventbus: Emitter.EventEmitter) => {

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
