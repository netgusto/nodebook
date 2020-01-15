import { defaultInitNotebook } from '../defaultInitNotebook';
import stdExec from '../../stdexec';
import stdExecDocker from '../../stdexecdocker';
import { Recipe } from '../../types';

const recipe: Recipe = ({
    key: 'clojure',
    name: 'Clojure',
    language: 'Clojure',
    mainfile: ['index.clj', 'main.clj'],
    cmmode: 'clojure',
    dir: __dirname,
    exec: async ({ notebook, docker, writeStdOut, writeStdErr, writeInfo, env }) => {
        let command;

        if (docker) {
            return stdExecDocker({
                image: 'clojure:tools-deps',
                cmd: ['sh', '-c', 'clojure ' + notebook.mainfilename],
                cwd: '/code',
                mounts: [
                    { from: notebook.absdir, to: '/code', mode: 'rw' },
                ],
                env,
            }, writeStdOut, writeStdErr, writeInfo);
        } else {
            return stdExec({
                cmd: ['sh', '-c', 'clojure ' + notebook.mainfilename],
                cwd: notebook.absdir,
                env,
            }, writeStdOut, writeStdErr, writeInfo);
        }
    },
    init: async ({ name, notebookspath }) => await defaultInitNotebook(recipe, notebookspath, name),
});

export default recipe;