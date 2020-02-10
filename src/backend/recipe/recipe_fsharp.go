package recipe

import (
	"github.com/netgusto/nodebook/src/backend/recipe/helper"
	"github.com/netgusto/nodebook/src/shared/types"
)

func Fsharp() types.Recipe {
	return helper.StdRecipe(
		"fsharp",     // key
		"F#",         // name
		"fsharp",     // language
		"Program.fs", // mainfile
		"mllike",     // cmmode
		"docker.io/microsoft/dotnet",
		func(notebook types.Notebook) []string {
			return []string{"dotnet", "run"}
		},
		func(notebook types.Notebook) []string {
			return []string{"dotnet", "run"}
		},
		func(notebook types.Notebook, env map[string]string) map[string]string {
			env["DOTNET_CLI_TELEMETRY_OPTOUT"] = "1"
			return env
		},
		nil,
	)
}
