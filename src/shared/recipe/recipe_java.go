package recipe

import (
	"github.com/netgusto/nodebook/src/shared/recipe/helper"
	"github.com/netgusto/nodebook/src/shared/types"
)

func Java() types.Recipe {
	return helper.StdRecipe(
		"java",      // key
		"Java",      // name
		"Java",      // language
		"main.java", // mainfile
		"clike",     // cmmode
		"docker.io/library/java:latest",
		func(notebook types.Notebook) []string {
			return []string{"sh", "-c", `javac -d /tmp "/code/` + notebook.GetRecipe().GetMainfile() + `" && cd /tmp && java Main`}
		},
		func(notebook types.Notebook) []string {
			return []string{"sh", "-c", `javac -d /tmp "` + notebook.GetMainFileAbsPath() + `" && cd /tmp && java Main`}
		},
		nil,
		nil,
	)
}
