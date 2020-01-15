"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const recursiveCopy = require("recursive-copy");
const path_1 = require("path");
const defaultInitNotebook = (recipe, notebookspath, name) => copyFilesAndFolders(path_1.join(path_1.join(recipe.dir, 'defaultcontent')), path_1.join(notebookspath, name));
exports.defaultInitNotebook = defaultInitNotebook;
function copyFilesAndFolders(sourcedir, targetdir) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield recursiveCopy(sourcedir, targetdir, {
                overwrite: false,
                dot: true,
                junk: true,
            });
        }
        catch (e) {
            return false;
        }
        return true;
    });
}
