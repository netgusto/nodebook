package helper

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"os/exec"

	dockerTypes "github.com/docker/docker/api/types"
	"github.com/netgusto/nodebook/src/core/shared/types"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/network"
	"github.com/docker/docker/client"
	"github.com/docker/docker/pkg/stdcopy"
	"github.com/pkg/errors"
)

func stdExecDocker(ctnrinfo types.ContainerInfo, writeStdOut, writeStdErr, writeInfo io.Writer) types.ExecHandler {

	ctx := context.Background()
	cli, err := client.NewEnvClient()
	var cont container.ContainerCreateCreatedBody

	return types.CallbackExecHandler{
		StartFunc: func() {

			if err != nil {
				panic(err)
			}

			createContainer := func() (container.ContainerCreateCreatedBody, error) {
				return cli.ContainerCreate(ctx, &container.Config{
					Image:        ctnrinfo.Image,
					Cmd:          ctnrinfo.Cmd,
					Tty:          false,
					AttachStdout: true,
					AttachStderr: true,
					WorkingDir:   ctnrinfo.Cwd,
					Env:          serializeEnv(ctnrinfo.Env),
				}, &container.HostConfig{
					Binds: mountsToDockerBinds(ctnrinfo.Mounts),
				}, &network.NetworkingConfig{}, "")
			}

			cont, err = createContainer()
			if err != nil {
				// Pulling image from registry
				events, err := cli.ImagePull(ctx, ctnrinfo.Image, dockerTypes.ImagePullOptions{})
				if err != nil {
					panic(errors.Wrap(err, "Could not pull image from registry"))
				}

				d := json.NewDecoder(events)

				type Event struct {
					ID             string `json:"id"`
					Status         string `json:"status"`
					Error          string `json:"error"`
					Progress       string `json:"progress"`
					ProgressDetail *struct {
						Current float64 `json:"current"`
						Total   float64 `json:"total"`
					} `json:"progressDetail"`
				}

				var event *Event
				for {
					if err := d.Decode(&event); err != nil {
						if err == io.EOF {
							events.Close()
							break
						}

						panic(err)
					}

					percent := 0.0
					percentStr := ""
					if event.ProgressDetail != nil {
						current := event.ProgressDetail.Current
						total := event.ProgressDetail.Total
						if total > 0 {
							percent = (current / total) * 100
							percentStr = fmt.Sprintf("%2.2f", percent)
						}
					}

					msg := event.Status
					if event.ID != "" {
						msg += " " + event.ID
					}

					if percentStr != "" {
						msg += " " + percentStr + "%"
					}

					msg += "\n"

					_, _ = writeInfo.Write([]byte(msg))
				}

				cont, err = createContainer()
				if err != nil {
					panic(errors.Wrap(err, "ERROR: Downloaded Docker image, but could not create container nevertheless"))
				}
			}

			if err := cli.ContainerStart(ctx, cont.ID, dockerTypes.ContainerStartOptions{}); err != nil {
				panic(errors.Wrap(err, "ERROR: Downloaded image, but to no avail"))
			}

			go dockerLogs(ctx, cont, cli, writeStdOut, writeStdErr)

			if _, err := cli.ContainerWait(ctx, cont.ID); err != nil {
				panic(errors.Wrap(err, "Error: can not wait for container to end"))
			}

			// Work around docker bug: not providing log if no newline present
			swOut, ok := writeStdOut.(*types.StreamWriter)
			if ok && swOut.BytesWritten() == 0 {
				dockerLogs(ctx, cont, cli, writeStdOut, nil)
			}

			swErr, ok := writeStdErr.(*types.StreamWriter)
			if ok && swErr.BytesWritten() == 0 {
				dockerLogs(ctx, cont, cli, nil, writeStdErr)
			}

			err = cli.ContainerRemove(ctx, cont.ID, dockerTypes.ContainerRemoveOptions{})
			if err != nil {
				panic(errors.Wrapf(err, "ERROR: Could not remove container "+cont.ID))
			}
		},
		StopFunc: func() {
			err := cli.ContainerKill(ctx, cont.ID, "SIGKILL")
			if err != nil {
				panic(errors.Wrapf(err, "ERROR: Could not kill container %s", cont.ID))
			}

			ctx.Done()
		},
	}
}

func dockerLogs(ctx context.Context, cont container.ContainerCreateCreatedBody, cli *client.Client, writeStdOut, writeStdErr io.Writer) {
	reader, err := cli.ContainerLogs(ctx, cont.ID, dockerTypes.ContainerLogsOptions{
		ShowStderr: writeStdErr != nil,
		ShowStdout: writeStdOut != nil,
		Timestamps: false,
		Follow:     true,
		Tail:       "all",
	})

	if err != nil {
		panic(err)
	}
	defer reader.Close()

	_, err = stdcopy.StdCopy(writeStdOut, writeStdErr, reader) // demux
	if err != nil {
		panic(errors.Wrap(err, "Could not copy output"))
	}
}

func stdExecLocal(processinfo types.ProcessInfo, writeStdOut, writeStdErr, writeInfo io.Writer) types.ExecHandler {
	var cmd *exec.Cmd

	return types.CallbackExecHandler{
		StartFunc: func() {
			cmd = exec.Command(processinfo.Cmd[0], processinfo.Cmd[1:]...)
			cmd.Dir = processinfo.Cwd
			cmd.Env = append(os.Environ(), serializeEnv(processinfo.Env)...)
			cmd.Stdout = writeStdOut
			cmd.Stderr = writeStdErr
			err := cmd.Run()
			if err != nil {
				_, _ = writeStdErr.Write([]byte(err.Error() + "\n"))
				return
			}

			if !cmd.ProcessState.Success() {
				_, _ = writeStdErr.Write([]byte(fmt.Sprintf("Process exited with status code %d\n", cmd.ProcessState.ExitCode())))
			}
		},
		StopFunc: func() {
			_ = cmd.Process.Kill()
		},
	}
}

func serializeEnv(env types.EnvInfo) []string {
	serializedenv := []string{}

	if env == nil {
		return serializedenv
	}

	for key, val := range env {
		serializedenv = append(serializedenv, fmt.Sprintf("%s=%s", key, val))
	}

	return serializedenv
}

func mountsToDockerBinds(mounts []types.ContainerMount) []string {
	dockerbinds := []string{}
	if mounts == nil {
		return dockerbinds
	}

	for _, mount := range mounts {
		dockerbinds = append(dockerbinds, fmt.Sprintf("%s:%s:%s", mount.From, mount.To, mount.Mode))
	}

	return dockerbinds
}
