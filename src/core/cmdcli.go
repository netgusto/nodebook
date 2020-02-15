package main

import (
	"fmt"
	"io"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/netgusto/nodebook/src/core/shared"
	"github.com/netgusto/nodebook/src/core/shared/service"
	"github.com/netgusto/nodebook/src/core/shared/types"
	pkgErrors "github.com/pkg/errors"
	"github.com/ttacon/chalk"
)

func cliRun(notebookspath string, docker bool) {
	if docker && !shared.IsDockerRunning() {
		fmt.Println("docker is not running on the host, but --docker requested.")
		os.Exit(1)
	}

	_, nbRegistry := baseServices(notebookspath)

	notebooks := nbRegistry.GetNotebooks()
	if len(notebooks) == 0 {
		fmt.Printf("Nodebook exited. No notebook found in %s\n", notebookspath)
		os.Exit(1)
	}

	stdOut := os.Stdout
	stdErr := types.NewStreamWriter(func(data string) {
		os.Stdout.Write(append([]byte(chalk.Red.String()), append([]byte(data), []byte(chalk.Reset.String())...)...))
	})
	stdInfo := types.NewStreamWriter(func(data string) {
		os.Stdout.Write(append([]byte(chalk.Cyan.String()), append([]byte(data), []byte(chalk.Reset.String())...)...))
	})

	// Watch notebooks
	nbWatcher, err := service.NewNotebookWatcher(nbRegistry, notebookChangedHandler(docker, stdOut, stdErr, stdInfo))
	if err != nil {
		fmt.Println(pkgErrors.Wrap(err, "Could not create notebook watcher"))
		os.Exit(1)
	}

	for _, notebook := range nbRegistry.GetNotebooks() {
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

	nbNotebooks := len(notebooks)
	plural := ""
	if nbNotebooks > 1 {
		plural = "s"
	}

	_, _ = stdInfo.Write([]byte(fmt.Sprintf("Nodebook started. %d notebook%s watched in %s\n", nbNotebooks, plural, notebookspath)))

	<-make(chan interface{})
}

func notebookChangedHandler(useDocker bool, stdOut, stdErr, stdInfo io.Writer) func(notebook types.Notebook) {

	return func(notebook types.Notebook) {

		start := time.Now()

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
