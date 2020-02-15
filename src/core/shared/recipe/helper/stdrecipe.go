package helper

import (
	"io"

	"github.com/netgusto/nodebook/src/core/shared/types"
)

type cmdBuilderFunc = func(types.Notebook) []string
type envBuilderFunc = func(types.Notebook, map[string]string) map[string]string
type mountsBuilderFunc = func(types.Notebook, []types.ContainerMount) []types.ContainerMount

func StdRecipe(
	key, name, language, mainfile, cmmode, dockerImage string,
	dockerCmd, localCmd cmdBuilderFunc,
	addEnv envBuilderFunc,
	addMounts mountsBuilderFunc,
) types.Recipe {
	return types.MakeRecipeReal(
		key,                 // key
		name,                // name
		language,            // language
		mainfile,            // mainfile
		cmmode,              // cmmode
		"/src/recipes/"+key, // dir
		func(notebook types.Notebook, docker bool, writeStdOut, writeStdErr, writeInfo io.Writer, env map[string]string) types.ExecHandler { // exec

			if env == nil {
				env = map[string]string{}
			}

			if addEnv != nil {
				env = addEnv(notebook, env)
			}

			mounts := []types.ContainerMount{
				types.ContainerMount{
					From: notebook.GetAbsdir(),
					To:   "/code",
					Mode: "rw",
				},
			}

			if addMounts != nil {
				mounts = addMounts(notebook, mounts)
			}

			if docker {
				return stdExecDocker(types.ContainerInfo{
					Image:  dockerImage,
					Cmd:    dockerCmd(notebook),
					Cwd:    "/code",
					Mounts: mounts,
					Env:    env,
				}, writeStdOut, writeStdErr, writeInfo)
			}
			return stdExecLocal(types.ProcessInfo{
				Cmd: localCmd(notebook),
				Cwd: notebook.GetAbsdir(),
				Env: env,
			}, writeStdOut, writeStdErr, writeInfo)
		},
		func(recipe types.Recipe, notebookspath, name string) error { // init
			return defaultInitNotebook(recipe, notebookspath, name)
		},
	)
}
