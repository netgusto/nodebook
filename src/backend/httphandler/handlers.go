package httphandler

import (
	"encoding/json"
	"io/ioutil"
	"net/http"
	"strings"

	"github.com/markbates/pkger"
	"github.com/netgusto/nodebook/src/shared/service"
	"github.com/netgusto/nodebook/src/shared/types"
)

type HTTPHandler = func(res http.ResponseWriter, req *http.Request)

func generatePageHtml(routename string, params map[string]interface{}) (string, error) {
	f, err := pkger.Open("/dist/frontend/index.html")
	if err != nil {
		panic(err)
	}
	content, err := ioutil.ReadAll(f)
	if err != nil {
		panic(err)
	}

	jsonParams, _ := json.Marshal(params)

	strContent := string(content)
	strContent = strings.Replace(strContent, "\"#route#\"", "\""+routename+"\"", -1)
	strContent = strings.Replace(strContent, "\"#params#\"", string(jsonParams), -1)

	return strContent, nil
}

type NotebookSummaryFrontend struct {
	Name   string                `json:"name"`
	Url    string                `json:"url"`
	Mtime  string                `json:"mtime"`
	Recipe RecipeSummaryFrontend `json:"recipe"`
}

type RecipeSummaryFrontend struct {
	Key      string `json:"key"`
	Name     string `json:"name"`
	Language string `json:"language"`
	Cmmode   string `json:"cmmode"`
}

func extractFrontendNotebookSummary(notebook types.Notebook, routes *service.Routes) NotebookSummaryFrontend {
	return NotebookSummaryFrontend{
		Name:   notebook.GetName(),
		Url:    routes.Notebook(notebook.GetName()),
		Mtime:  notebook.GetMtime(),
		Recipe: extractFrontendRecipeSummary(notebook.GetRecipe()),
	}
}

func extractFrontendRecipeSummary(recipe types.Recipe) RecipeSummaryFrontend {
	return RecipeSummaryFrontend{
		Key:      recipe.GetKey(),
		Name:     recipe.GetName(),
		Language: recipe.GetLanguage(),
		Cmmode:   recipe.GetCmmode(),
	}
}
