package recipe

import (
	"github.com/netgusto/nodebook/src/core/shared/recipe/helper"
	"github.com/netgusto/nodebook/src/core/shared/types"
)

func Php() types.Recipe {
	return helper.StdRecipe(
		"php",      // key
		"PHP",      // name
		"PHP",      // language
		"main.php", // mainfile
		"php",      // cmmode
		"docker.io/library/php:latest",
		func(notebook types.Notebook) []string {
			return []string{"php", "/code/" + notebook.GetRecipe().GetMainfile()}
		},
		func(notebook types.Notebook) []string {
			return []string{"php", notebook.GetMainFileAbsPath()}
		},
		nil,
		nil,
	)
}
