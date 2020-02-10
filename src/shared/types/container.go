package types

type ContainerInfo struct {
	Cmd    []string
	Cwd    string
	Env    EnvInfo
	Image  string
	Mounts []ContainerMount
}

type ContainerMount struct {
	From string
	To   string
	Mode string // 'ro'|'rw'
}
