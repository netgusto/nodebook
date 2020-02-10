package recipe

import (
	"github.com/netgusto/nodebook/src/shared/recipe/helper"
	"github.com/netgusto/nodebook/src/shared/types"
)

func Swift() types.Recipe {
	return helper.StdRecipe(
		"swift",      // key
		"Swift",      // name
		"Swift",      // language
		"main.swift", // mainfile
		"swift",      // cmmode
		"docker.io/library/swift:latest",
		func(notebook types.Notebook) []string {
			return []string{"swift", "/code/" + notebook.GetRecipe().GetMainfile()}
		},
		func(notebook types.Notebook) []string {
			return []string{"swift", notebook.GetMainFileAbsPath()}
		},
		nil,
		nil,
	)
}
