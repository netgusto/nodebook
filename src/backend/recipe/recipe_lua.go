package recipe

import (
	"github.com/netgusto/nodebook/src/backend/recipe/helper"
	"github.com/netgusto/nodebook/src/shared/types"
)

func Lua() types.Recipe {
	return helper.StdRecipe(
		"lua",      // key
		"Lua",      // name
		"Lua",      // language
		"main.lua", // mainfile
		"lua",      // cmmode
		"docker.io/superpaintman/lua:latest",
		func(notebook types.Notebook) []string {
			return []string{"lua", "/code/" + notebook.GetRecipe().GetMainfile()}
		},
		func(notebook types.Notebook) []string {
			return []string{"lua", notebook.GetMainFileAbsPath()}
		},
		nil,
		nil,
	)
}
