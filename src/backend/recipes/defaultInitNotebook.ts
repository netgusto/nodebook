import * as recursiveCopy from 'recursive-copy';
import { join as pathJoin } from 'path';
import { Recipe } from '../types';

const defaultInitNotebook = (recipe: Recipe, notebookspath: string, name: string) => copyFilesAndFolders(
    pathJoin(pathJoin(recipe.dir, 'defaultcontent')),
    pathJoin(notebookspath, name)
);

async function copyFilesAndFolders(sourcedir: string, targetdir: string) {

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
