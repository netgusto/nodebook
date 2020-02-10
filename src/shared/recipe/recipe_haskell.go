package recipe

import (
	"github.com/netgusto/nodebook/src/shared/recipe/helper"
	"github.com/netgusto/nodebook/src/shared/types"
)

func Haskell() types.Recipe {
	return helper.StdRecipe(
		"haskell", // key
		"Haskell", // name
		"Haskell", // language
		"main.hs", // mainfile
		"haskell", // cmmode
		"docker.io/library/haskell:latest",
		func(notebook types.Notebook) []string {
			return []string{"sh", "-c", "ghc -v0 -H14m -outputdir /tmp -o /tmp/code \"/code/" + notebook.GetRecipe().GetMainfile() + "\" && /tmp/code"}
		},
		func(notebook types.Notebook) []string {
			return []string{"bash", "-c", "ghc -v0 -H14m -outputdir /tmp -o /tmp/code \"" + notebook.GetMainFileAbsPath() + "\" && /tmp/code"}
		},
		nil,
		nil,
	)
}
