.PHONY: deps build install-frontend build-frontend

deps:
	go get github.com/markbates/pkger/cmd/pkger

build:
	pkger
	make build-go

install-frontend:
	cd src/frontend && npm i

build-go:
	go build -o dist/nbk ./src/core

build-frontend:
	cd src/frontend && npm run build
	rm -Rf dist/frontend/*.map
