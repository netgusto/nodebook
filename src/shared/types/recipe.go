package types

import (
	"encoding/json"
	"io"
)

type Recipe interface {
	GetKey() string
	GetName() string
	GetLanguage() string
	GetMainfile() string
	GetCmmode() string
	GetDir() string
	ExecNotebook(notebook Notebook, docker bool, writeStdOut io.Writer, writeStdErr io.Writer, writeInfo io.Writer, env EnvInfo) ExecHandler
	InitNotebook(recipe Recipe, notebookspath string, name string) error
}

func MakeRecipeReal(
	key,
	name,
	language,
	mainfile,
	cmmode,
	dir string,
	exec func(
		notebook Notebook,
		docker bool,
		writeStdOut io.Writer,
		writeStdErr io.Writer,
		writeInfo io.Writer,
		env EnvInfo,
	) ExecHandler,
	init func(
		recipe Recipe,
		notebookspath string,
		name string,
	) error,
) RecipeReal {
	return RecipeReal{
		key,
		name,
		language,
		mainfile,
		cmmode,
		dir,
		exec,
		init,
	}
}

type RecipeReal struct {
	key      string
	name     string
	language string
	mainfile string
	cmmode   string
	dir      string
	exec     func(
		notebook Notebook,
		docker bool,
		writeStdOut io.Writer,
		writeStdErr io.Writer,
		writeInfo io.Writer,
		env EnvInfo,
	) ExecHandler
	init func(
		recipe Recipe,
		notebookspath string,
		name string,
	) error
}

func (r RecipeReal) ExecNotebook(notebook Notebook,
	docker bool,
	writeStdOut io.Writer,
	writeStdErr io.Writer,
	writeInfo io.Writer,
	env EnvInfo) ExecHandler {
	return r.exec(notebook, docker, writeStdOut, writeStdErr, writeInfo, env)
}

func (r RecipeReal) InitNotebook(
	recipe Recipe,
	notebookspath string,
	name string) error {
	return r.init(recipe, notebookspath, name)
}

func (r RecipeReal) MarshalJSON() ([]byte, error) {
	return json.Marshal(&struct {
		Key      string `json:"key"`
		Name     string `json:"name"`
		Language string `json:"language"`
		Mainfile string `json:"mainfile"`
		CMMode   string `json:"cmmode"`
		Dir      string `json:"dir"`
	}{
		Key:      r.key,
		Name:     r.name,
		Language: r.language,
		Mainfile: r.mainfile,
		CMMode:   r.cmmode,
		Dir:      r.dir,
	})
}

func (r RecipeReal) GetKey() string {
	return r.key
}

func (r RecipeReal) GetName() string {
	return r.name
}

func (r RecipeReal) GetLanguage() string {
	return r.language
}

func (r RecipeReal) GetMainfile() string {
	return r.mainfile
}

func (r RecipeReal) GetCmmode() string {
	return r.cmmode
}

func (r RecipeReal) GetDir() string {
	return r.dir
}
