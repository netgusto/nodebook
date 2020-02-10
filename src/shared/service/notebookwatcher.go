package service

import (
	"log"
	"path/filepath"

	"github.com/fsnotify/fsnotify"
	"github.com/netgusto/nodebook/src/shared/types"
	"github.com/pkg/errors"
)

type NotebookWatcher struct {
	watcher          *fsnotify.Watcher
	onChange         func(types.Notebook)
	notebookregistry *NotebookRegistry
}

func NewNotebookWatcher(registry *NotebookRegistry, onChange func(types.Notebook)) (*NotebookWatcher, error) {
	watcher, err := fsnotify.NewWatcher()

	if err != nil {
		return nil, errors.Wrap(err, "Could not build FS watcher")
	}
	// defer w.watcher.Close()

	return &NotebookWatcher{
		notebookregistry: registry,
		watcher:          watcher,
		onChange:         onChange,
	}, nil
}

func (w *NotebookWatcher) AddNotebook(notebook types.Notebook) error {
	if err := w.watcher.Add(notebook.GetAbsdir()); err != nil {
		return errors.Wrapf(err, "Could not watch %s", notebook.GetAbsdir())
	}

	return nil
}

func (w *NotebookWatcher) Watch() error {

	////////////////
	// watch

	done := make(chan bool)
	go func() {
		for {
			select {
			case event, ok := <-w.watcher.Events:
				if !ok {
					return
				}

				if event.Op&fsnotify.Write == fsnotify.Write {

					notebookname := filepath.Base(filepath.Dir(event.Name))
					notebook, err := w.notebookregistry.GetNotebookByName(notebookname)
					if err != nil {
						log.Printf("ERROR: COULD NOT FIND NOTEBOOK FOR NAME %s\n", notebookname)
					}

					if w.onChange != nil {
						w.onChange(notebook)
					}
				}
			case err, ok := <-w.watcher.Errors:
				if !ok {
					return
				}

				panic(err)
			}
		}
	}()

	<-done

	return nil
	// watcher: https://github.com/fsnotify/fsnotify/blob/master/example_test.go
}
