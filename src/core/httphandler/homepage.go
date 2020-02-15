package httphandler

import (
	"net/http"
	"sort"
	"strings"

	"github.com/netgusto/nodebook/src/core/shared/service"
)

func HomePageHandler(
	notebookregistry *service.NotebookRegistry,
	reciperegistry *service.RecipeRegistry,
	routes *service.Routes,
) HTTPHandler {
	return func(res http.ResponseWriter, req *http.Request) {
		strContent, err := generatePageHtml("home", map[string]interface{}{
			"newnotebookurl": routes.APINewNotebook(),
			"notebooks":      listNotebooks(notebookregistry, routes),
			"recipes":        reciperegistry.GetRecipes(),
		})
		if err != nil {
			http.Error(res, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return
		}

		_, _ = res.Write([]byte(strContent))
	}
}

func listNotebooks(notebookRegistry *service.NotebookRegistry, routes *service.Routes) []NotebookSummaryFrontend {

	notebooks := notebookRegistry.GetNotebooks()
	sort.Slice(notebooks, func(a, b int) bool {
		return strings.Compare(
			strings.ToLower(notebooks[a].GetAbsdir()),
			strings.ToLower(notebooks[b].GetAbsdir()),
		) > -1
	})

	summaries := make([]NotebookSummaryFrontend, len(notebooks))
	for i, notebook := range notebooks {
		summaries[i] = extractFrontendNotebookSummary(notebook, routes)
	}

	return summaries
}
