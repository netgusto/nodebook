package recipe

import (
	"os"
	"path"

	"github.com/netgusto/nodebook/src/shared/recipe/helper"
	"github.com/netgusto/nodebook/src/shared/types"
)

func Typescript() types.Recipe {
	return helper.StdRecipe(
		"typescript", // key
		"TypeScript", // name
		"TypeScript", // language
		"index.ts",   // mainfile
		"javascript", // cmmode
		"docker.io/sandrokeil/typescript:latest",
		func(notebook types.Notebook) []string {
			if hasTsNode(notebook) {
				return []string{"sh", "-c", "node_modules/.bin/ts-node " + notebook.GetRecipe().GetMainfile()}
			}

			return []string{"sh", "-c", "tsc --allowJs --outFile /tmp/code.js " + notebook.GetRecipe().GetMainfile() + " && node /tmp/code.js"}
		},
		func(notebook types.Notebook) []string {
			if hasTsNode(notebook) {
				return []string{"sh", "-c", "node_modules/.bin/ts-node " + notebook.GetRecipe().GetMainfile()}
			}

			return []string{"sh", "-c", "tsc --allowJs --outFile /tmp/code.js " + notebook.GetRecipe().GetMainfile() + " && node /tmp/code.js"}
		},
		nil,
		nil,
	)
}

func hasTsNode(notebook types.Notebook) bool {
	info, err := os.Stat(path.Join(notebook.GetAbsdir(), "node_modules", ".bin", "ts-node"))
	return err == nil && info.Mode().IsRegular()
}
