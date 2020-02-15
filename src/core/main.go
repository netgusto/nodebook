package main

import (
	"fmt"
	"os"

	"github.com/alecthomas/kingpin"
	"github.com/markbates/pkger"
	"github.com/netgusto/nodebook/src/core/shared/recipe"
	"github.com/netgusto/nodebook/src/core/shared/service"

	pkgErrors "github.com/pkg/errors"
)

var _ = pkger.Include("/dist/frontend/")
var _ = pkger.Include("/src/recipes/")

func main() {

	webCmd := kingpin.Command("web", "Web")
	webCmdPath := webCmd.Arg("notebookspath", "path to notebooks").Default(".").ExistingDir()
	webCmdDocker := webCmd.Flag("docker", "Use docker").Bool()
	webCmdPort := webCmd.Flag("port", "HTTP port").Default("8000").Int()
	webCmdBindAddress := webCmd.Flag("bindaddress", "Bind address").Default("127.0.0.1").String()

	cliCmd := kingpin.Command("cli", "cli")
	cliCmdPath := cliCmd.Arg("notebookspath", "path to notebooks").Default(".").ExistingDir()
	cliCmdDocker := cliCmd.Flag("docker", "Use docker").Bool()

	args := os.Args[1:]
	selected, err := kingpin.CommandLine.Parse(args)
	if err != nil {
		if len(args) == 0 {
			fmt.Println(err)
			os.Exit(1)
		}

		if args[0] != webCmd.FullCommand() && args[0] != cliCmd.FullCommand() {
			args = append([]string{"web"}, args...)
		} else {
			fmt.Println(err)
			os.Exit(1)
		}

		selected, err = kingpin.CommandLine.Parse(args)
		if err != nil {
			fmt.Println(err)
			os.Exit(1)
		}
	}

	switch selected {
	case webCmd.FullCommand():
		webRun(*webCmdPath, *webCmdDocker, *webCmdBindAddress, *webCmdPort)
	case cliCmd.FullCommand():
		cliRun(*cliCmdPath, *cliCmdDocker)
	}
}

func baseServices(notebooksPath string) (*service.RecipeRegistry, *service.NotebookRegistry) {
	// Recipe registry
	recipeRegistry := service.NewRecipeRegistry()
	recipe.AddRecipesToRegistry(recipeRegistry)

	// Notebook registry
	nbRegistry := service.NewNotebookRegistry(notebooksPath, recipeRegistry)

	// Find notebooks
	notebooks, err := nbRegistry.FindNotebooks(nbRegistry.GetNotebooksPath())
	if err != nil {
		fmt.Println(pkgErrors.Wrapf(err, "Could not find notebooks in %s", nbRegistry.GetNotebooksPath()))
		os.Exit(1)
	}

	// Register notebooks
	for _, notebook := range notebooks {
		nbRegistry.RegisterNotebook(notebook)
	}

	return recipeRegistry, nbRegistry
}
