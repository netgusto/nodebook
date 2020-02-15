package recipe

import (
	"github.com/netgusto/nodebook/src/core/shared/recipe/helper"
	"github.com/netgusto/nodebook/src/core/shared/types"
)

func Elixir() types.Recipe {
	return helper.StdRecipe(
		"elixir",  // key
		"Elixir",  // name
		"Elixir",  // language
		"main.ex", // mainfile
		"elixir",  // cmmode
		"docker.io/library/elixir:latest",
		func(notebook types.Notebook) []string {
			return []string{"elixir", "/code/" + notebook.GetRecipe().GetMainfile()}
		},
		func(notebook types.Notebook) []string {
			return []string{"elixir", notebook.GetMainFileAbsPath()}
		},
		nil,
		nil,
	)
}
