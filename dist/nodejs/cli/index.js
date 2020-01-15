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
const child_process_1 = require("child_process");
const sanitizeparameters_1 = require("./sanitizeparameters");
const cli_1 = require("./cli");
(function () {
    return __awaiter(this, void 0, void 0, function* () {
        let parameters;
        try {
            parameters = yield sanitizeparameters_1.default(process.argv.slice(2));
        }
        catch (e) {
            return console.error(e.message);
        }
        if (parameters.docker && !(yield isDockerRunning())) {
            throw new Error('docker is not running on the host, but --docker requested.');
        }
        try {
            yield cli_1.default({
                notebookspath: parameters.notebooks,
                logger: console.log,
                docker: parameters.docker,
            });
        }
        catch (e) {
            console.error(e);
        }
    });
})();
function isDockerRunning() {
    return new Promise(resolve => {
        child_process_1.exec('docker ps', err => resolve(err === null));
    });
}
;
