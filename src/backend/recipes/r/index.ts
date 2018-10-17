import { defaultInitNotebook } from '../defaultInitNotebook';
import stdExec from '../../stdexec';
import stdExecDocker from '../../stdexecdocker';
import { Recipe } from '../../types';

const recipe: Recipe = ({
    key: 'r',
    name: 'R',
    language: 'R',
    mainfile: ['index.r', 'main.r'],
    cmmode: 'r',
    dir: __dirname,
    exec: async ({ notebook, docker, writeStdOut, writeStdErr, writeInfo, env }) => {

        if (docker) {
            return stdExecDocker({
                image: 'r-base:latest',
                cmd: ["Rscript", "/code/" + notebook.mainfilename,],
                cwd: '/code',
                mounts: [
                    { from: notebook.absdir, to: '/code', mode: 'rw' },
                ],
                env,
            }, writeStdOut, writeStdErr, writeInfo);
        } else {
            return stdExec({
                cmd: ['Rscript', notebook.mainfilename],
                cwd: notebook.absdir,
                env,
            }, writeStdOut, writeStdErr, writeInfo);
        }
    },
    init: async ({ name, notebookspath }) => await defaultInitNotebook(recipe, notebookspath, name),
});

export default recipe;
