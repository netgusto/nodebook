package types

type ProcessInfo struct {
	Cmd []string
	Cwd string
	Env EnvInfo
}
