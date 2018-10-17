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
const stream = require("stream");
const Docker = require("dockerode");
const docker = new Docker();
const envToDockerEnv = env => {
    const dockerenv = [];
    if (!env)
        return dockerenv;
    Object.keys(env).forEach(function (key) {
        dockerenv.push(key + '=' + env[key]);
    });
    return dockerenv;
};
function stdExecDocker(ctnrinfo, writeStdOut, writeStdErr, writeInfo) {
    let container;
    return {
        start: () => __awaiter(this, void 0, void 0, function* () {
            const { image, cmd, cwd, mounts, env } = ctnrinfo;
            const stdout = new stream.Writable({
                write: (chunk, _, done) => {
                    writeStdOut(chunk.toString('utf-8'));
                    done();
                }
            });
            const stderr = new stream.Writable({
                write: (chunk, _, done) => {
                    writeStdErr(chunk.toString('utf-8'));
                    done();
                }
            });
            const stdinfo = new stream.Writable({
                write: (chunk, _, done) => {
                    writeInfo(chunk.toString('utf-8'));
                    done();
                }
            });
            const ctnroptions = {
                Image: image,
                Cmd: cmd,
                Tty: false,
                WorkingDir: cwd,
                Env: envToDockerEnv(env),
                HostConfig: {
                    Binds: mounts.map(m => m.from + ':' + m.to + ':' + m.mode),
                },
            };
            try {
                container = yield docker.createContainer(ctnroptions);
            }
            catch (e) {
                // Image does not exist in local registry; try to pull it from Docker Hub
            }
            if (!container) {
                try {
                    yield new Promise(resolve => docker.pull(image, function (err, stream) {
                        docker.modem.followProgress(stream, onFinished, onProgress);
                        function onFinished(err, output) {
                            resolve();
                        }
                        function onProgress(event) {
                            let percent;
                            if (event.progressDetail) {
                                const { current, total } = event.progressDetail;
                                if (total) {
                                    percent = ((current / total) * 100).toFixed(2);
                                    if (percent < 10)
                                        percent = '0' + percent.toString();
                                }
                            }
                            stdinfo.write(event.status + (event.id ? ' ' + event.id : '') + (percent ? ' ' + percent + '%' : '') + "\n");
                        }
                    }));
                    container = yield docker.createContainer(ctnroptions);
                }
                catch (e) { }
            }
            if (!container) {
                throw new Error('Docker image ' + image + ' could not be run.');
            }
            yield container.attach({
                stream: true,
                stdout: true,
                stderr: true
            }, function (err, stream) {
                // dockerode may demultiplex attach streams for you :)
                container.modem.demuxStream(stream, stdout, stderr);
            });
            yield container.start();
            yield container.wait();
            yield container.remove();
        }),
        stop: () => __awaiter(this, void 0, void 0, function* () {
            if (!container)
                return;
            try {
                yield container.kill();
            }
            catch (e) { }
            // remove is handled in start Promise, triggered after container.wait()
        }),
    };
}
exports.default = stdExecDocker;
;
