package helper

import (
	"io"
	"os"
	"path"
	"path/filepath"

	"github.com/markbates/pkger"
	"github.com/netgusto/nodebook/src/shared/types"
	"github.com/pkg/errors"
)

func defaultInitNotebook(recipe types.Recipe, notebookspath, name string) error {

	dirPerms := os.FileMode(0755)
	filePerm := os.FileMode(0644)

	srcPath := path.Join(recipe.GetDir(), "defaultcontent")
	destPathRoot := path.Join(notebookspath, name)
	if err := os.MkdirAll(destPathRoot, dirPerms); err != nil {
		return errors.Wrap(err, "defaultInitNotebook: Could not create notebook directory "+destPathRoot)
	}

	return pkger.Walk(srcPath, func(pathStr string, info os.FileInfo, err error) error {

		pathParts, _ := pkger.Parse(pathStr)
		relPath := pathParts.Name[len(srcPath):] // make path relative to "defaultcontent"
		destPath := path.Join(destPathRoot, relPath)

		if info.IsDir() {
			if err := os.MkdirAll(destPath, dirPerms); err != nil {
				return errors.Wrap(err, "defaultInitNotebook: Could not create notebook directory "+destPath)
			}
		} else {
			dir := filepath.Dir(destPath)
			if err := os.MkdirAll(dir, dirPerms); err != nil {
				return errors.Wrap(err, "defaultInitNotebook: Could not create notebook directory "+dir)
			}

			source, err := pkger.Open(pathStr)
			if err != nil {
				return errors.Wrap(err, "defaultInitNotebook: Could not open notebook default content file "+pathStr)
			}
			defer source.Close()

			destination, err := os.OpenFile(destPath, os.O_CREATE|os.O_RDWR|os.O_TRUNC, filePerm)
			if err != nil {
				return errors.Wrap(err, "defaultInitNotebook: Could not create notebook file "+destPath)
			}
			defer destination.Close()

			_, err = io.Copy(destination, source)
			if err != nil {
				return errors.Wrap(err, "defaultInitNotebook: Could not copy notebook default content file "+pathStr)
			}
		}

		return nil
	})
}
