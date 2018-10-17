import { defaultInitNotebook } from '../defaultInitNotebook';
import stdExec from '../../stdexec';
import stdExecDocker from '../../stdexecdocker';

const recipe = ({
    key: 'haskell',
    name: 'Haskell',
    language: 'Haskell',
    mainfile: ['index.hs', 'main.hs'],
    cmmode: 'haskell',
    dir: __dirname,
    exec: ({ notebook, docker, writeStdOut, writeStdErr, writeInfo, env }) => {

        if (docker) {
            return stdExecDocker({
                image: 'haskell:latest',
                cmd: ['sh', '-c', 'ghc -v0 -H14m -outputdir /tmp -o /tmp/code "/code/' + notebook.mainfilename + '" && /tmp/code',],
                cwd: '/code',
                mounts: [
                    { from: notebook.absdir, to: '/code', mode: 'rw' },
                ],
                env,
            }, writeStdOut, writeStdErr, writeInfo);
        } else {
            return stdExec({
                cmd: ['bash', '-c', 'ghc -v0 -H14m -outputdir /tmp -o /tmp/code ' + notebook.mainfilename + ' && /tmp/code'],
                cwd: notebook.absdir,
                env,
            }, writeStdOut, writeStdErr, writeInfo);
        }
    },
    init: async ({ name, notebookspath }) => await defaultInitNotebook(recipe, notebookspath, name),
});

export default recipe;
