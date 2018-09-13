const { copy: recursiveCopy } = require('fs-extra');
const { join: pathJoin } = require('path');

const defaultInitNotebook = (recipe, notebookspath, name) => copyFilesAndFolders(
    pathJoin(pathJoin(recipe.dir, 'defaultcontent')),
    pathJoin(notebookspath, name),
);

async function copyFilesAndFolders(sourcedir, targetdir) {

    try {
        await recursiveCopy(sourcedir, targetdir, {
            overwrite: false,
            errorOnExist: true,
        });
    } catch(e) {
        return false;
    }

    return true;
}

module.exports = {
    defaultInitNotebook,
};
