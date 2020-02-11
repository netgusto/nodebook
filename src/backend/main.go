package main

import (
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/markbates/pkger"
	"github.com/netgusto/nodebook/src/shared"
	"github.com/netgusto/nodebook/src/shared/recipe"
	"github.com/netgusto/nodebook/src/shared/service"
	"github.com/netgusto/nodebook/src/shared/types"
	pkgErrors "github.com/pkg/errors"

	"github.com/alecthomas/kong"
)

type Parameters struct {
	types.StdParameters
	Port        int    `default:"8000"`
	Bindaddress string `default:"127.0.0.1"`
}

func main() {

	pkger.Include("/dist/frontend/")
	pkger.Include("/src/recipes/")

	p, _, err := getParameters()
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}

	if p.Docker && !shared.IsDockerRunning() {
		fmt.Println("docker is not running on the host, but --docker requested.")
		os.Exit(1)
	}

	// Recipe registry
	recipeRegistry := service.NewRecipeRegistry()
	recipe.AddRecipesToRegistry(recipeRegistry)

	// Notebook registry
	nbRegistry := service.NewNotebookRegistry(p.GetNotebooksPath(), recipeRegistry)

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

	csrfService := service.NewCSRFService()
	routes := service.NewRoutes()

	api := makeAPI(
		nbRegistry,
		recipeRegistry,
		routes,
		csrfService,
		p.Docker,
	)

	fmt.Printf("nbk listening on %s:%d\n", p.Bindaddress, p.Port)
	srv := &http.Server{
		Handler:     api,
		Addr:        fmt.Sprintf("%s:%d", p.Bindaddress, p.Port),
		ReadTimeout: 15 * time.Second,
		// no write timeout, we may need to stream responses for indefinite amounts of time
	}

	log.Fatal(srv.ListenAndServe())
}

func getParameters() (Parameters, *kong.Context, error) {
	p := Parameters{}
	ctx := kong.Parse(&p)

	// Port
	if p.Port <= 0 || p.Port > 65535 {
		return p, nil, errors.New("Port is out of range")
	}

	// Determine notebooks path
	if p.NotebooksPathFlag == "" && p.NotebooksPathArg == "" {
		return p, nil, errors.New("--notebooks path/to/notebooks is required if path not provided as argument")
	}

	if p.NotebooksPathFlag != "" && p.NotebooksPathArg != "" {
		return p, nil, errors.New("Please provide either --notebooks or the path argument, not both")
	}

	path := p.GetNotebooksPath()
	s, err := os.Stat(path)
	if os.IsNotExist(err) {
		return p, nil, errors.New("Notebooks path does not exist")
	}

	if !s.IsDir() {
		return p, nil, errors.New("Notebooks path is not a directory")
	}

	return p, ctx, nil
}
