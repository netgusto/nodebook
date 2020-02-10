package recipe

import (
	"github.com/netgusto/nodebook/src/backend/recipe/helper"
	"github.com/netgusto/nodebook/src/shared/types"
)

func Go() types.Recipe {
	return helper.StdRecipe(
		"go",      // key
		"Go",      // name
		"Go",      // language
		"main.go", // mainfile
		"go",      // cmmode
		"docker.io/library/golang:latest",
		func(notebook types.Notebook) []string {
			return []string{"go", "run", "/code/" + notebook.GetRecipe().GetMainfile()}
		},
		func(notebook types.Notebook) []string {
			return []string{"go", "run", notebook.GetMainFileAbsPath()}
		},
		nil,
		nil,
	)
}
