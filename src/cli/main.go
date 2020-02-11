package main

import (
	"errors"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/markbates/pkger"
	"github.com/netgusto/nodebook/src/shared"
	"github.com/netgusto/nodebook/src/shared/recipe"
	"github.com/netgusto/nodebook/src/shared/service"
	"github.com/netgusto/nodebook/src/shared/types"
	pkgErrors "github.com/pkg/errors"
	"github.com/ttacon/chalk"

	"github.com/alecthomas/kong"
)

type Parameters struct {
	types.StdParameters
}

func main() {

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

	// Watch notebooks
	nbWatcher, err := service.NewNotebookWatcher(nbRegistry, notebookChangedHandler(p.Docker))
	if err != nil {
		fmt.Println(pkgErrors.Wrap(err, "Could not create notebook watcher"))
		os.Exit(1)
	}

	for _, notebook := range notebooks {
		if err := nbWatcher.AddNotebook(notebook); err != nil {
			fmt.Println(pkgErrors.Wrapf(err, "Could not watch notebook %s", notebook.GetName()))
			os.Exit(1)
		}
	}

	go (func() {
		if err := nbWatcher.Watch(); err != nil {
			fmt.Println(pkgErrors.Wrap(err, "Could not watch notebooks"))
			os.Exit(1)
		}
	})()

	<-make(chan interface{})

	// var nbWatcher *service.NotebookWatcher
}

func getParameters() (Parameters, *kong.Context, error) {
	p := Parameters{}
	ctx := kong.Parse(&p)

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

func notebookChangedHandler(useDocker bool) func(notebook types.Notebook) {

	return func(notebook types.Notebook) {

		start := time.Now()

		stdOut := os.Stdout
		stdErr := types.NewStreamWriter(func(data string) {
			os.Stdout.Write(append([]byte(chalk.Red.String()), append([]byte(data), []byte(chalk.Reset.String())...)...))
		})
		stdInfo := types.NewStreamWriter(func(data string) {
			os.Stdout.Write(append([]byte(chalk.Cyan.String()), append([]byte(data), []byte(chalk.Reset.String())...)...))
		})

		label := fmt.Sprintf("%s (%s)", notebook.GetName(), notebook.GetRecipe().GetName())

		_, _ = stdInfo.Write([]byte(
			fmt.Sprintf("Executing %s; interrupt with Ctrl+c\n", label),
		))

		execHandler := notebook.GetRecipe().ExecNotebook(
			notebook,
			useDocker,
			stdOut,
			stdErr,
			stdInfo,
			nil,
		)

		done := make(chan interface{})
		go func() {
			execHandler.Start()
			done <- nil
		}()

		sigs := make(chan os.Signal, 1)
		signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)
		defer signal.Reset(syscall.SIGINT, syscall.SIGTERM)

		select {
		case <-done:
			_, _ = stdInfo.Write([]byte(fmt.Sprintf(
				"Done; took %.1f ms\n",
				float64(time.Since(start).Microseconds())/1000.0,
			)))
		case <-sigs:
			// Ctrl+c outputs ^C in some terminals
			// writing on a new line to avoid being shifted right by 2 chars
			_, _ = stdOut.Write([]byte("\n"))
			_, _ = stdInfo.Write([]byte("Interrupting...\n"))
			execHandler.Stop()
			_, _ = stdInfo.Write([]byte(fmt.Sprintf(
				"Interrupted %s\n", label,
			)))
		}
	}
}
