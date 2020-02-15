package recipe

import (
	"github.com/netgusto/nodebook/src/core/shared/recipe/helper"
	"github.com/netgusto/nodebook/src/core/shared/types"
)

func R() types.Recipe {
	return helper.StdRecipe(
		"r",      // key
		"R",      // name
		"R",      // language
		"main.r", // mainfile
		"r",      // cmmode
		"docker.io/library/r-base:latest",
		func(notebook types.Notebook) []string {
			return []string{"Rscript", "/code/" + notebook.GetRecipe().GetMainfile()}
		},
		func(notebook types.Notebook) []string {
			return []string{"Rscript", notebook.GetMainFileAbsPath()}
		},
		nil,
		nil,
	)
}
