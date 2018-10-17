import { defaultInitNotebook } from '../defaultInitNotebook';
import stdExec from '../../stdexec';
import stdExecDocker from '../../stdexecdocker';
import { Recipe } from '../../types';

const recipe: Recipe = ({
    key: 'python3',
    name: 'Python 3',
    language: 'Python',
    mainfile: ['index.py', 'main.py'],
    cmmode: 'python',
    dir: __dirname,
    exec: async ({ notebook, docker, writeStdOut, writeStdErr, writeInfo, env }) => {

        if (docker) {
            return stdExecDocker({
                image: 'python:3',
                cmd: ['python', '/code/' + notebook.mainfilename,],
                cwd: '/code',
                mounts: [
                    { from: notebook.absdir, to: '/code', mode: 'rw' },
                ],
                env,
            }, writeStdOut, writeStdErr, writeInfo);
        } else {
            return stdExec({
                cmd: ['python', notebook.mainfilename],
                cwd: notebook.absdir,
                env,
            }, writeStdOut, writeStdErr, writeInfo);
        }
    },
    init: async ({ name, notebookspath }) => await defaultInitNotebook(recipe, notebookspath, name),
});

export default recipe;
