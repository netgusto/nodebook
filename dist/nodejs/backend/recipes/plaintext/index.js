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
const defaultInitNotebook_1 = require("../defaultInitNotebook");
const stdexec_1 = require("../../stdexec");
const recipe = ({
    key: 'plaintext',
    language: 'Plain text',
    name: 'Plain text',
    mainfile: ['index.txt', 'main.txt'],
    cmmode: 'plaintext',
    dir: __dirname,
    exec: ({ notebook, writeStdOut, writeStdErr, writeInfo, env }) => __awaiter(void 0, void 0, void 0, function* () {
        return stdexec_1.default({
            cmd: ['cat', notebook.mainfilename],
            cwd: notebook.absdir,
            env,
        }, writeStdOut, writeStdErr, writeInfo);
    }),
    init: ({ name, notebookspath }) => __awaiter(void 0, void 0, void 0, function* () { return yield defaultInitNotebook_1.defaultInitNotebook(recipe, notebookspath, name); }),
});
exports.default = recipe;
