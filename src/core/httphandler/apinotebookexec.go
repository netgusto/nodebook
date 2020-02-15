package httphandler

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
	"path"
	"strings"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/netgusto/nodebook/src/core/shared/service"
	"github.com/netgusto/nodebook/src/core/shared/types"

	pkgErrors "github.com/pkg/errors"
)

var running map[string]func() = map[string]func(){}

func ApiNotebookExecHandler(notebookRegistry *service.NotebookRegistry, csrfService *service.CSRFService, useDocker bool) HTTPHandler {
	return func(res http.ResponseWriter, req *http.Request) {

		decoder := json.NewDecoder(req.Body)
		var post struct {
			CSRFToken service.CSRFToken `json:"csrfToken"`
		}
		err := decoder.Decode(&post)
		if err != nil || !csrfService.IsValid(post.CSRFToken) {
			http.Error(res, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
			return
		}

		params := mux.Vars(req)
		name, found := params["name"]
		if !found || strings.TrimSpace(name) == "" {
			http.Error(res, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
			return
		}

		notebook, err := notebookRegistry.GetNotebookByName(name)
		if err != nil {
			http.Error(res, http.StatusText(http.StatusNotFound), http.StatusNotFound)
			return
		}

		res.Header().Add("Content-Type", "application/stream+json; charset=utf8")
		res.Header().Add("Cache-Control", "max-age=0")

		execHandler, err := execNotebook(notebook, useDocker, res)
		if err != nil {
			http.Error(res, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return
		}

		running[notebook.GetName()] = execHandler.Stop
		execHandler.Start()
		delete(running, notebook.GetName())
	}
}

func execNotebook(notebook types.Notebook, docker bool, res io.Writer) (types.ExecHandler, error) {

	write := func(data string, outputChannel string) {

		dataJson, _ := json.Marshal(data)
		payload := map[string]interface{}{
			"chan": outputChannel,
			"data": string(dataJson),
		}
		out, _ := json.Marshal(payload)
		_, _ = res.Write([]byte(string(out) + "\n"))
		if f, ok := res.(http.Flusher); ok {
			f.Flush()
		}
	}

	writeStdOut := types.NewStreamWriter(func(data string) {
		write(data, "stdout")
	})

	writeStdErr := types.NewStreamWriter(func(data string) {
		write(data, "stderr")
	})

	writeInfo := types.NewStreamWriter(func(data string) {
		write(data, "info")
	})

	// extracting .env from notebook if defined
	env, err := getNotebookEnv(notebook)
	if err != nil {
		return nil, pkgErrors.Wrap(err, "execNotebook: Error while reading env for notebook")
	}

	return notebook.GetRecipe().ExecNotebook(
		notebook,
		docker,
		writeStdOut,
		writeStdErr,
		writeInfo,
		env,
	), nil
}

func getNotebookEnv(notebook types.Notebook) (map[string]string, error) {

	env := map[string]string{}
	abspath := path.Join(notebook.GetAbsdir(), ".env")
	info, err := os.Stat(abspath)
	if err != nil || !info.Mode().IsRegular() {
		// no .env in the notebook, or it's not a file
		return env, nil
	}

	f, err := os.Open(abspath)
	if err != nil {
		return nil, pkgErrors.Wrapf(err, "getNotebookEnv: Could not open .env for read in notebook %s", notebook.GetName())
	}

	env, err = godotenv.Parse(f)
	if err != nil {
		return nil, pkgErrors.Wrapf(err, "getNotebookEnv: Could not parse .env in notebook %s", notebook.GetName())
	}

	return env, nil
}
