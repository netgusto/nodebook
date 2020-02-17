package core

import (
	"fmt"
	"os"
    "path/filepath"

	"github.com/netgusto/nodebook/src/core/shared/recipe"
	"github.com/netgusto/nodebook/src/core/shared/service"
	pkgErrors "github.com/pkg/errors"
)

func baseServices(notebooksPath string) (*service.RecipeRegistry, *service.NotebookRegistry) {
	// Recipe registry
	recipeRegistry := service.NewRecipeRegistry()
	recipe.AddRecipesToRegistry(recipeRegistry)

    absBookPath, err := filepath.Abs(notebooksPath)
    if err != nil {
        fmt.Println("Could not get absolute path")
        os.Exit(1)
    }

	// Notebook registry
	nbRegistry := service.NewNotebookRegistry(absBookPath, recipeRegistry)

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
