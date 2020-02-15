package service

import "net/url"

type Routes struct{}

func NewRoutes() *Routes {
	return &Routes{}
}

func (r Routes) APINewNotebook() string {
	return "/api/notebook/new"
}

func (r Routes) APINotebookSetContent(name string) string {
	return "/api/notebook/" + url.PathEscape(name) + "/setcontent"
}

func (r Routes) APINotebookExec(name string) string {
	return "/api/notebook/" + url.PathEscape(name) + "/exec"
}

func (r Routes) APINotebookStop(name string) string {
	return "/api/notebook/" + url.PathEscape(name) + "/stop"
}

func (r Routes) APINotebookRename(name string) string {
	return "/api/notebook/" + url.PathEscape(name) + "/rename"
}

func (r Routes) Home() string {
	return "/"
}

func (r Routes) Notebook(name string) string {
	return "/notebook/" + url.PathEscape(name)
}
