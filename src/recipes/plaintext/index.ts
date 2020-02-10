import { defaultInitNotebook } from '../defaultInitNotebook';
import stdExec from '../../stdexec';
import { Recipe } from '../../types';

const recipe: Recipe = ({
    key: 'plaintext',
    language: 'Plain text',
    name: 'Plain text',
    mainfile: ['index.txt', 'main.txt'],
    cmmode: 'plaintext',
    dir: __dirname,
    exec: async ({ notebook, writeStdOut, writeStdErr, writeInfo, env }) => {
        return stdExec({
            cmd: ['cat', notebook.mainfilename],
            cwd: notebook.absdir,
            env,
        }, writeStdOut, writeStdErr, writeInfo);
        
    },
    init: async ({ name, notebookspath }) => await defaultInitNotebook(recipe, notebookspath, name),
});

export default recipe;
