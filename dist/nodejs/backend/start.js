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
const child_process_1 = require("child_process");
const app_1 = require("./app");
const sanitizeparameters_1 = require("./sanitizeparameters");
function start() {
    return __awaiter(this, void 0, void 0, function* () {
        let parameters;
        try {
            parameters = yield sanitizeparameters_1.sanitizeParameters(process.argv.slice(2));
        }
        catch (e) {
            return console.error(e.message);
        }
        if (parameters.docker && !(yield isDockerRunning())) {
            throw new Error('docker is not running on the host, but --docker requested.');
        }
        const service = yield app_1.app({
            port: parameters.port,
            bindaddress: parameters.bindaddress,
            notebookspath: parameters.notebooks,
            docker: parameters.docker,
            logger: (msg) => console.log(msg),
        });
        return { service, parameters };
    });
}
exports.default = start;
;
function isDockerRunning() {
    return new Promise(resolve => {
        child_process_1.exec('docker ps', err => resolve(err === null));
    });
}
;
