package recipe

import (
	"os"
	"path"

	"github.com/netgusto/nodebook/src/core/shared/recipe/helper"
	"github.com/netgusto/nodebook/src/core/shared/types"
	"github.com/pkg/errors"
)

func Rust() types.Recipe {
	return helper.StdRecipe(
		"rust",    // key
		"Rust",    // name
		"Rust",    // language
		"main.rs", // mainfile
		"rust",    // cmmode
		"docker.io/library/rust:latest",
		func(notebook types.Notebook) []string {
			if hasCargo(notebook) {
				return []string{"sh", "-c", "cd /code/ && cargo run"}
			}

			return []string{"sh", "-c", "rustc -o /tmp/code.out /code/" + notebook.GetRecipe().GetMainfile() + " && /tmp/code.out"}
		},
		func(notebook types.Notebook) []string {
			if hasCargo(notebook) {
				return []string{"cargo", "run"}
			}

			return []string{"sh", "-c", "rustc -o /tmp/code.out \"" + notebook.GetMainFileAbsPath() + "\" && /tmp/code.out"}
		},
		nil,
		func(notebook types.Notebook, mounts []types.ContainerMount) []types.ContainerMount {
			if hasCargo(notebook) {
				mounts = append(mounts, types.ContainerMount{
					From: path.Join(rustCargoHome(), "registry"),
					To:   "/usr/local/cargo/registry",
					Mode: "rw",
				})
			}

			return mounts
		},
	)
}

func hasCargo(notebook types.Notebook) bool {
	info, err := os.Stat(path.Join(notebook.GetAbsdir(), "Cargo.toml"))
	return err == nil && info.Mode().IsRegular()
}

func rustCargoHome() string {
	if value, found := os.LookupEnv("CARGO_HOME"); found {
		return value
	}

	homedir, err := os.UserHomeDir()
	if err != nil {
		panic(errors.Wrap(err, "Could not identify user home dir"))
	}

	return path.Join(homedir, ".cargo")
}
