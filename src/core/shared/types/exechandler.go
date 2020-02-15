package types

type ExecHandler interface {
	Start()
	Stop()
}

type EnvInfo = map[string]string
