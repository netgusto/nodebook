package recipe

import (
	"github.com/netgusto/nodebook/src/backend/recipe/helper"
	"github.com/netgusto/nodebook/src/shared/types"
)

func Ruby() types.Recipe {
	return helper.StdRecipe(
		"ruby",    // key
		"Ruby",    // name
		"Ruby",    // language
		"main.rb", // mainfile
		"ruby",    // cmmode
		"docker.io/library/ruby:latest",
		func(notebook types.Notebook) []string {
			return []string{"ruby", "/code/" + notebook.GetRecipe().GetMainfile()}
		},
		func(notebook types.Notebook) []string {
			return []string{"ruby", notebook.GetMainFileAbsPath()}
		},
		nil,
		nil,
	)
}
