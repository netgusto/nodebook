package httphandler

import (
	"encoding/json"
	"net/http"

	"github.com/netgusto/nodebook/src/shared/service"
)

func CsrfHandler(csrf *service.CSRFService) HTTPHandler {
	return func(res http.ResponseWriter, req *http.Request) {
		token := csrf.NewToken()

		payload, err := json.Marshal(map[string]string{
			"csrfToken": string(token),
		})

		if err != nil {
			panic(err)
		}

		res.Header().Set("Cache-Control", "max-age=0")
		res.Header().Set("Content-Type", "application/json; charset=utf-8")
		_, _ = res.Write(payload)
	}
}
