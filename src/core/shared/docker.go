package shared

import "os/exec"

func IsDockerRunning() bool {
	return exec.Command("docker", "ps").Run() == nil
}
