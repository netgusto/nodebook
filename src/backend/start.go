package main

import (
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"time"

	"github.com/gorilla/mux"
	"github.com/markbates/pkger"
	"github.com/netgusto/nodebook/src/backend/httphandler"
	"github.com/netgusto/nodebook/src/shared/recipe"
	"github.com/netgusto/nodebook/src/shared/service"
	pkgErrors "github.com/pkg/errors"

	"github.com/alecthomas/kong"
)

type Parameters struct {
	Port              int    `default:"8000"`
	Bindaddress       string `default:"127.0.0.1"`
	Docker            bool   `default:"false"`
	NotebooksPathFlag string `name:"notebooks" default:"" type:"path"`
	NotebooksPathArg  string `arg:"" optional:"" name:"path" default:"" type:"path"`
}

func (p Parameters) GetNotebooksPath() string {
	if p.NotebooksPathFlag != "" {
		return p.NotebooksPathFlag
	}

	return p.NotebooksPathArg
}

func start() {

	pkger.Include("/dist/frontend/")
	pkger.Include("/src/recipes/")

	p, _, err := getParameters()
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}

	if p.Docker && !isDockerRunning() {
		fmt.Println("docker is not running on the host, but --docker requested.")
		os.Exit(1)
	}

	recipeRegistry := service.NewRecipeRegistry().
		AddRecipe(recipe.C()).
		AddRecipe(recipe.Clojure()).
		AddRecipe(recipe.Cpp()).
		AddRecipe(recipe.Csharp()).
		AddRecipe(recipe.Elixir()).
		AddRecipe(recipe.Fsharp()).
		AddRecipe(recipe.Go()).
		AddRecipe(recipe.Haskell()).
		AddRecipe(recipe.Java()).
		AddRecipe(recipe.Lua()).
		AddRecipe(recipe.NodeJS()).
		AddRecipe(recipe.Ocaml()).
		AddRecipe(recipe.Php()).
		AddRecipe(recipe.Python3()).
		AddRecipe(recipe.R()).
		AddRecipe(recipe.Ruby()).
		AddRecipe(recipe.Rust()).
		AddRecipe(recipe.Swift()).
		AddRecipe(recipe.Typescript())

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

	/*

		// Watch notebooks
		nbWatcher, err := NewNotebookWatcher(nbRegistry, func(notebook Notebook) {
			execHandler := notebook.recipe.exec(
				notebook,
				p.Docker,
				os.Stdout,
				WrappedIOWriter{func(p []byte) []byte {
					return append([]byte(chalk.Red.String()), append(p, []byte(chalk.Reset.String())...)...)
				}, os.Stderr},
				WrappedIOWriter{func(p []byte) []byte {
					return append([]byte(chalk.Cyan.String()), append(p, []byte(chalk.Reset.String())...)...)
				}, os.Stdout},
				nil,
			)

			go execHandler.Start()
		})
		if err != nil {
			fmt.Println(pkgErrors.Wrap(err, "Could not create notebook watcher"))
			os.Exit(1)
		}

		for _, notebook := range notebooks {
			if err := nbWatcher.AddNotebook(notebook); err != nil {
				fmt.Println(pkgErrors.Wrapf(err, "Could not watch notebook %s", notebook.name))
				os.Exit(1)
			}
		}

		go (func() {
			if err := nbWatcher.Watch(); err != nil {
				fmt.Println(pkgErrors.Wrap(err, "Could not watch notebooks"))
				os.Exit(1)
			}
		})()

	*/

	var nbWatcher *service.NotebookWatcher

	csrfService := service.NewCSRFService()
	routes := service.NewRoutes()

	fs := http.FileServer(pkger.Dir("/dist/frontend/"))

	root := mux.NewRouter()
	root.Path("/").HandlerFunc(httphandler.HomePageHandler(nbRegistry, recipeRegistry, routes))
	root.Path("/csrf").HandlerFunc(httphandler.CsrfHandler(csrfService))
	root.Path("/notebook/{name}").HandlerFunc(httphandler.NotebookHandler(nbRegistry, routes))

	api := root.Methods("post").PathPrefix("/api").Subrouter()
	api.Path("/notebook/new").HandlerFunc(httphandler.ApiNewNotebookHandler(
		nbRegistry,
		recipeRegistry,
		nbWatcher,
		csrfService,
		routes,
		p.GetNotebooksPath(),
	))

	api.Path("/notebook/{name}/rename").HandlerFunc(httphandler.ApiNotebookRenameHandler(nbRegistry, csrfService, routes))
	api.Path("/notebook/{name}/setcontent").HandlerFunc(httphandler.ApiNotebookSetContentHandler(nbRegistry, csrfService))
	api.Path("/notebook/{name}/exec").HandlerFunc(httphandler.ApiNotebookExecHandler(nbRegistry, csrfService, p.Docker))
	api.Path("/notebook/{name}/stop").HandlerFunc(httphandler.ApiNotebookStopHandler(nbRegistry, csrfService))

	root.PathPrefix("/").Handler(fs)

	log.Println("Listening...")
	srv := &http.Server{
		Handler:     root,
		Addr:        "127.0.0.1:8000",
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

func isDockerRunning() bool {
	return exec.Command("docker", "ps").Run() == nil
}
