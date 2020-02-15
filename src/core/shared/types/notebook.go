package types

import (
	"encoding/json"
	"path"
)

type Notebook interface {
	GetName() string
	GetAbsdir() string
	GetMtime() string
	SetMtime(mtime string)
	GetRecipe() Recipe
	GetMainFileAbsPath() string
}

func MakeNotebookReal(notebookname, absdir, mtime string, recipe Recipe) NotebookReal {
	return NotebookReal{
		name:   notebookname,
		absdir: absdir,
		mtime:  mtime,
		recipe: recipe,
	}
}

type NotebookReal struct {
	name   string
	absdir string
	mtime  string
	recipe Recipe
}

func (n *NotebookReal) SetMtime(mtime string) {
	n.mtime = mtime
}

func (n NotebookReal) GetName() string {
	return n.name
}

func (n NotebookReal) GetAbsdir() string {
	return n.absdir
}

func (n NotebookReal) GetMtime() string {
	return n.mtime
}

func (n NotebookReal) GetRecipe() Recipe {
	return n.recipe
}

func (n NotebookReal) MarshalJSON() ([]byte, error) {
	return json.Marshal(&struct {
		Name   string `json:"name"`
		AbsDir string `json:"absdir"`
		MTime  string `json:"mtime"`
		Recipe Recipe `json:"recipe"`
	}{
		Name:   n.GetName(),
		AbsDir: n.GetAbsdir(),
		MTime:  n.GetMtime(),
		Recipe: n.GetRecipe(),
	})
}

func (n NotebookReal) GetMainFileAbsPath() string {
	return path.Join(n.absdir, n.recipe.GetMainfile())
}
