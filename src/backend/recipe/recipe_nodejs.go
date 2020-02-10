package recipe

import (
	"github.com/netgusto/nodebook/src/backend/recipe/helper"
	"github.com/netgusto/nodebook/src/shared/types"
)

func NodeJS() types.Recipe {
	return helper.StdRecipe(
		"nodejs",     // key
		"NodeJS",     // name
		"JavaScript", // language
		"index.js",   // mainfile
		"javascript", // cmmode
		"docker.io/library/node:alpine",
		func(notebook types.Notebook) []string {
			return []string{"node", "--harmony", "/code/" + notebook.GetRecipe().GetMainfile()}
		},
		func(notebook types.Notebook) []string {
			return []string{"node", "--harmony", notebook.GetMainFileAbsPath()}
		},
		nil,
		nil,
	)
}
