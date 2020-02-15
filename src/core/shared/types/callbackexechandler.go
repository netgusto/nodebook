package types

type CallbackExecHandler struct {
	StartFunc func()
	StopFunc  func()
}

func (ceh CallbackExecHandler) Start() {
	ceh.StartFunc()
}

func (ceh CallbackExecHandler) Stop() {
	ceh.StopFunc()
}
