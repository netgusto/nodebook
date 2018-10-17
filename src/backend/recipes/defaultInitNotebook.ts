import * as recursiveCopy from 'recursive-copy';
import { join as pathJoin } from 'path';

const defaultInitNotebook = (recipe, notebookspath, name) => copyFilesAndFolders(
    pathJoin(pathJoin(recipe.dir, 'defaultcontent')),
    pathJoin(notebookspath, name)
);

async function copyFilesAndFolders(sourcedir, targetdir) {

    try {
        await recursiveCopy(sourcedir, targetdir, {
            overwrite: false,
            dot: true,
            junk: true,
        });
    } catch(e) {
        return false;
    }

    return true;
}

export {
    defaultInitNotebook,
};
