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
const parseArgs = require("minimist");
const path_1 = require("path");
const fs = require("fs");
function sanitizeParameters(rawargv) {
    return __awaiter(this, void 0, void 0, function* () {
        const argv = parseArgs(rawargv, {
            boolean: 'docker',
            string: ['notebooks'],
        });
        // --docker
        const docker = argv.docker;
        // --notebooks
        let notebooks;
        if (!("notebooks" in argv) || typeof argv.notebooks !== "string" || argv.notebooks.trim() === '') {
            if (argv['_'].length > 0) {
                notebooks = argv['_'].shift().trim();
            }
            else {
                throw new Error("--notebooks path/to/notebooks is required if path not provided as argument.");
            }
        }
        else {
            notebooks = argv.notebooks;
        }
        notebooks = path_1.resolve(notebooks);
        if (!fs.existsSync(notebooks)) {
            throw new Error("Notebooks path does not exist.");
        }
        if (!fs.statSync(notebooks).isDirectory()) {
            throw new Error("Notebooks path is not a directory.");
        }
        // Check for unknown parameters
        if (argv['_'].length > 0) {
            // ex: node . "abcdef"
            throw new Error("Unknown argument(s): " + argv['_'].join(', '));
        }
        const known = ['notebooks', 'docker'];
        const unknown = Object.keys(argv).filter((key, _) => key !== '_' && (known.indexOf(key) === -1));
        if (unknown.length > 0) {
            throw new Error("Unknown parameter(s): " + unknown.join(', '));
        }
        return { notebooks, docker };
    });
}
exports.default = sanitizeParameters;
