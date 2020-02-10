package recipe

import (
	"github.com/netgusto/nodebook/src/backend/recipe/helper"
	"github.com/netgusto/nodebook/src/shared/types"
)

func Python3() types.Recipe {
	return helper.StdRecipe(
		"python3",  // key
		"Python 3", // name
		"Python",   // language
		"main.py",  // mainfile
		"python",   // cmmode
		"docker.io/library/python:3",
		func(notebook types.Notebook) []string {
			return []string{"python", "/code/" + notebook.GetRecipe().GetMainfile()}
		},
		func(notebook types.Notebook) []string {
			return []string{"python", notebook.GetMainFileAbsPath()}
		},
		nil,
		nil,
	)
}
