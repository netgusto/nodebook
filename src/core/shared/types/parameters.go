package types

type StdParameters struct {
	Docker            bool   `default:"false"`
	NotebooksPathFlag string `name:"notebooks" default:"" type:"path"`
	NotebooksPathArg  string `arg:"" optional:"" name:"path" default:"" type:"path"`
}

func (p StdParameters) GetNotebooksPath() string {
	if p.NotebooksPathFlag != "" {
		return p.NotebooksPathFlag
	}

	return p.NotebooksPathArg
}
