"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const defaultInitNotebook_1 = require("../defaultInitNotebook");
const stdexec_1 = require("../../stdexec");
const stdexecdocker_1 = require("../../stdexecdocker");
const recipe = ({
    key: 'csharp',
    name: 'C#',
    language: 'csharp',
    mainfile: ['Program.cs'],
    cmmode: 'clike',
    dir: __dirname,
    exec: ({ notebook, docker, writeStdOut, writeStdErr, writeInfo, env }) => __awaiter(this, void 0, void 0, function* () {
        const noTelemetryEnv = Object.assign({ DOTNET_CLI_TELEMETRY_OPTOUT: '1' }, env);
        if (docker) {
            return stdexecdocker_1.default({
                image: 'microsoft/dotnet',
                cmd: ['dotnet', 'run'],
                cwd: '/code',
                mounts: [
                    { from: notebook.absdir, to: '/code', mode: 'rw' },
                ],
                env: noTelemetryEnv,
            }, writeStdOut, writeStdErr, writeInfo);
        }
        else {
            return stdexec_1.default({
                cmd: ['dotnet', 'run'],
                cwd: notebook.absdir,
                env: noTelemetryEnv,
            }, writeStdOut, writeStdErr, writeInfo);
        }
    }),
    init: ({ name, notebookspath }) => __awaiter(this, void 0, void 0, function* () { return yield defaultInitNotebook_1.defaultInitNotebook(recipe, notebookspath, name); }),
});
exports.default = recipe;
