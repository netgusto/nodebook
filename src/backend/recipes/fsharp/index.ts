import { defaultInitNotebook } from '../defaultInitNotebook';
import stdExec from '../../stdexec';
import stdExecDocker from '../../stdexecdocker';
import { Recipe } from '../../types';

const recipe: Recipe = ({
    key: 'fsharp',
    name: 'F#',
    language: 'fsharp',
    mainfile: ['Program.fs'],
    cmmode: 'mllike',
    dir: __dirname,
    exec: async ({ notebook, docker, writeStdOut, writeStdErr, writeInfo, env }) => {

        const noTelemetryEnv = {
            DOTNET_CLI_TELEMETRY_OPTOUT: '1',
            ...env,
        };

        if (docker) {
            return stdExecDocker({
                image: 'microsoft/dotnet',
                cmd: ['dotnet', 'run'],
                cwd: '/code',
                mounts: [
                    { from: notebook.absdir, to: '/code', mode: 'rw' },
                ],
                env: noTelemetryEnv,
            }, writeStdOut, writeStdErr, writeInfo);
        } else {
            return stdExec({
                cmd: ['dotnet', 'run'],
                cwd: notebook.absdir,
                env: noTelemetryEnv,
            }, writeStdOut, writeStdErr, writeInfo);
        }
    },
    init: async ({ name, notebookspath }) => await defaultInitNotebook(recipe, notebookspath, name),
});

export default recipe;
