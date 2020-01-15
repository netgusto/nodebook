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
const trunk_1 = require("trunk");
const Emitter = require("events");
const notebookregistry_1 = require("../backend/services/notebookregistry");
const reciperegistry_1 = require("../backend/services/reciperegistry");
const write_1 = require("./write");
const onchange_1 = require("./onchange");
function cli({ notebookspath, logger, docker }) {
    return __awaiter(this, void 0, void 0, function* () {
        process.chdir(notebookspath);
        const trunk = new trunk_1.Trunk();
        trunk
            .add('notebookspath', () => notebookspath)
            .add('docker', () => docker)
            .add('logger', () => logger)
            .add('reciperegistry', () => new reciperegistry_1.default())
            .add('eventbus', () => {
            const emitter = new Emitter();
            const sigIntHandler = () => {
                let cancelled = false;
                const cancel = () => cancelled = true;
                emitter.emit('SIGINT', cancel);
                if (!cancelled) {
                    process.exit(0);
                }
            };
            process.on('SIGINT', sigIntHandler);
            return emitter;
        })
            .add('notebookregistry', ['docker', 'notebookspath', 'reciperegistry', 'eventbus'], (docker, notebookspath, reciperegistry, eventbus) => __awaiter(this, void 0, void 0, function* () {
            const change = onchange_1.withSameNotebookChangeThrottle(onchange_1.withProcessQueue((notebook) => onchange_1.onNotebookChange(notebook, docker, eventbus)), 200);
            const notebookregistry = new notebookregistry_1.default(notebookspath, reciperegistry, change);
            yield notebookregistry.mount();
            return notebookregistry;
        }));
        yield trunk.open();
        const registry = trunk.get('notebookregistry');
        const nbnotebooks = registry.getNotebooks().length;
        if (nbnotebooks) {
            write_1.writeInfoLn("Nodebook started. " + nbnotebooks + " notebook" + (nbnotebooks > 1 ? 's' : '') + " watched in " + notebookspath);
        }
        else {
            write_1.writeInfoLn("Nodebook started. No notebook yet in " + notebookspath);
        }
    });
}
exports.default = cli;
