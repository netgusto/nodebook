package recipe

import (
	"github.com/netgusto/nodebook/src/backend/recipe/helper"
	"github.com/netgusto/nodebook/src/shared/types"
)

func Csharp() types.Recipe {
	return helper.StdRecipe(
		"csharp",     // key
		"C#",         // name
		"csharp",     // language
		"Program.cs", // mainfile
		"clike",      // cmmode
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
