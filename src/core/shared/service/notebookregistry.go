package service

import (
	"fmt"
	"os"
	"path"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/netgusto/nodebook/src/core/shared/types"
	"github.com/pkg/errors"
)

type NotebookRegistry struct {
	notebookspath  string
	depth          int
	reciperegistry *RecipeRegistry
	notebookscache []types.Notebook
}

func NewNotebookRegistry(notebookspath string, reciperegistry *RecipeRegistry) *NotebookRegistry {
	return &NotebookRegistry{
		notebookspath:  path.Clean(notebookspath),
		depth:          2,
		reciperegistry: reciperegistry,
		notebookscache: []types.Notebook{},
	}
}

func (r NotebookRegistry) GetNotebooksPath() string {
	return r.notebookspath
}

func (r *NotebookRegistry) RegisterNotebook(notebook types.Notebook) {
	r.notebookscache = append(r.notebookscache, notebook)
}

func (r NotebookRegistry) GetNotebookByName(name string) (types.Notebook, error) {
	for _, notebook := range r.notebookscache {
		if notebook.GetName() == name {
			return notebook, nil
		}
	}

	return nil, errors.Errorf("Could not find notebook for name %s", name)
}

func (r NotebookRegistry) BuildNotebookDescriptor(notebookname string, recipe types.Recipe) (types.Notebook, error) {

	parts := strings.Split(notebookname, "/")
	if len(parts) > 1 && parts[0] == "src" && recipe.GetKey() == "rust" {
		notebookname = parts[0]
	}

	absdir := filepath.Join(r.notebookspath, notebookname)

	info, err := os.Stat(absdir)
	if err != nil {
		return nil, errors.Wrapf(err, "buildNotebookDescriptor: Could not stat notebook dir %s", absdir)
	}

	notebook := types.MakeNotebookReal(
		notebookname,
		absdir,
		info.ModTime().Format(time.RFC3339),
		recipe,
	)

	mainFile := notebook.GetMainFileAbsPath()
	infoFile, err := os.Stat(mainFile)
	if err != nil {
		return nil, errors.Wrapf(err, "buildNotebookDescriptor: Could not stat notebook main file %s", mainFile)
	}

	if infoFile.ModTime().After(info.ModTime()) {
		notebook.SetMtime(infoFile.ModTime().Format(time.RFC3339))
	}

	return &notebook, nil
}

func (r NotebookRegistry) determineNotebookNameByAbsDir(absdir string) string {
	return absdir[len(r.notebookspath)+1:]
}

func (r NotebookRegistry) GetNotebooks() []types.Notebook {
	return r.notebookscache
}

func (r NotebookRegistry) FindNotebooks(folderpath string) ([]types.Notebook, error) {

	paths := []types.Notebook{}

	info, err := os.Stat(folderpath)
	if err != nil || !info.IsDir() {
		return nil, errors.Wrapf(err, "Could not find notebooks in %s", folderpath)
	}

	searchedNames := map[string]*types.Recipe{}
	for i, recipe := range r.reciperegistry.recipes {
		searchedNames[recipe.GetMainfile()] = &r.reciperegistry.recipes[i]
	}

	err = walk(folderpath, info, 0, func(absPath string, info os.FileInfo, depth int, err error) error {
		if err != nil {
			return err
		}

		name := info.Name()

		if info.IsDir() {
			if depth > r.depth {
				return filepath.SkipDir
			}

			if name == "node_modules" || strings.HasPrefix(name, ".") {
				return filepath.SkipDir
			}
		} else {
			if recipe, found := searchedNames[name]; found {
				notebookname := r.determineNotebookNameByAbsDir(filepath.Dir(absPath))
				notebook, err := r.BuildNotebookDescriptor(notebookname, *recipe)
				if err != nil {
					return err
				}
				paths = append(paths, notebook)
			}
		}

		return nil
	})

	if err != nil {
		return nil, errors.Wrap(err, "Error while looking for notebooks")
	}

	return paths, nil // return collected paths
}

func (r *NotebookRegistry) Renamed(notebook types.Notebook, newname string) (types.Notebook, error) {
	renamedNotebook, err := r.BuildNotebookDescriptor(newname, notebook.GetRecipe())
	if err != nil {
		return nil, err
	}

	for i, nb := range r.notebookscache {
		if nb.GetName() == notebook.GetName() {
			r.notebookscache[i] = renamedNotebook
			return renamedNotebook, nil
		}
	}

	return nil, fmt.Errorf("Could not find notebook %s in registry", notebook.GetName())
}

func (r *NotebookRegistry) Refresh(notebook types.Notebook) (types.Notebook, error) {
	refreshedNotebook, err := r.BuildNotebookDescriptor(notebook.GetName(), notebook.GetRecipe())
	if err != nil {
		return nil, err
	}

	for i, nb := range r.notebookscache {
		if nb.GetName() == notebook.GetName() {
			r.notebookscache[i] = refreshedNotebook
			return refreshedNotebook, nil
		}
	}

	return nil, fmt.Errorf("Could not find notebook %s in registry", notebook.GetName())
}

type WalkFunc func(path string, info os.FileInfo, depth int, err error) error

// walk recursively descends path, calling walkFn.
// fork from filepath.walk, adding depth info
func walk(pathStr string, info os.FileInfo, depth int, walkFn WalkFunc) error {
	if !info.IsDir() {
		return walkFn(pathStr, info, depth, nil)
	}

	names, err := readDirNames(pathStr)
	err1 := walkFn(pathStr, info, depth, err)
	// If err != nil, walk can't walk into this directory.
	// err1 != nil means walkFn want walk to skip this directory or stop walking.
	// Therefore, if one of err and err1 isn't nil, walk will return.
	if err != nil || err1 != nil {
		// The caller's behavior is controlled by the return value, which is decided
		// by walkFn. walkFn may ignore err and return nil.
		// If walkFn returns SkipDir, it will be handled by the caller.
		// So walk should return whatever walkFn returns.
		return err1
	}

	for _, name := range names {
		filename := path.Join(pathStr, name)
		fileInfo, err := os.Lstat(filename)
		if err != nil {
			if err := walkFn(filename, fileInfo, depth, err); err != nil && err != filepath.SkipDir {
				return err
			}
		} else {
			err = walk(filename, fileInfo, depth+1, walkFn)
			if err != nil {
				if !fileInfo.IsDir() || err != filepath.SkipDir {
					return err
				}
			}
		}
	}
	return nil
}

// readDirNames reads the directory named by dirname and returns
// a sorted list of directory entries.
func readDirNames(dirname string) ([]string, error) {
	f, err := os.Open(dirname)
	if err != nil {
		return nil, err
	}
	names, err := f.Readdirnames(-1)
	f.Close()
	if err != nil {
		return nil, err
	}
	sort.Strings(names)
	return names, nil
}
