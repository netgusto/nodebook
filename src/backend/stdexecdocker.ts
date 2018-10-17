import * as stream from 'stream';
import * as Docker from 'dockerode';
const docker = new Docker();

const envToDockerEnv = env => {
    const dockerenv = [];
    if (!env) return dockerenv;

    Object.keys(env).forEach(function (key) {
        dockerenv.push(key + '=' + env[key]);
    });

    return dockerenv;
};

export default function stdExecDocker(ctnrinfo, writeStdOut, writeStdErr, writeInfo) {

    let container;

    return {
        start: async () => {

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
                container = await docker.createContainer(ctnroptions);
            } catch(e) {
                // Image does not exist in local registry; try to pull it from Docker Hub
            }

            if (!container) {
                try {
                    await new Promise(resolve => docker.pull(image, function(err, stream) {

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
                                    if (percent < 10) percent = '0' + percent.toString();
                                }
                            }
                            
                            stdinfo.write(event.status + (event.id ? ' ' + event.id : '') + (percent ? ' ' + percent + '%' : '') + "\n");
                        }
                    }));
                    container = await docker.createContainer(ctnroptions);
                } catch(e) { }
            }

            if (!container) {
                throw new Error('Docker image ' + image + ' could not be run.');
            }

            await container.attach({
                stream: true,
                stdout: true,
                stderr: true
            }, function (err, stream) {
                // dockerode may demultiplex attach streams for you :)
                container.modem.demuxStream(stream, stdout, stderr);
            });
            
            await container.start();
            await container.wait();
            await container.remove();
        },
        stop: async () => {
            if (!container) return;

            try {
                await container.kill();
            } catch(e) {}

            // remove is handled in start Promise, triggered after container.wait()
        },
    };
};