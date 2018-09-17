# nodebook [![Build Status](https://travis-ci.com/netgusto/nodebook.svg?branch=master)](https://travis-ci.com/netgusto/nodebook)

Nodebook - Multi-Language REPL with Web UI

## What is it?

Nodebook is an in-browser REPL supporting many programming languages. Code's on the left, Console's on the right. Click "Run" or press <kbd>Ctrl</kbd>+<kbd>Enter</kbd> or <kbd>Cmd</kbd>+<kbd>Enter</kbd> to run your code.
Code is automatically persisted on the file system.

![nodebook](https://user-images.githubusercontent.com/4974818/45320903-2cdec280-b544-11e8-9b2e-067b646de751.png)

A notebook is a folder containing an `{index|main}.{js,py,c,cpp,...}` file. The homepage lists all of the available notebooks.

![home](https://user-images.githubusercontent.com/4974818/45383977-fde05380-b60c-11e8-91cc-06548dd4fae8.png)

## Supported environments

* C11 `(.c)`
* C++14 `(.cpp)`
* Go `(.go)`
* Haskell `(.hs)`
* Java `(.java)`
* NodeJS `(.js)`
* Lua `(.lua)`
* PHP `(.php)`
* Python 3 `(.py)`
* R `(.r, .R)`
* Ruby `(.rb)`
* Rust `(.rs)` — Uses `cargo run` if `Cargo.toml` is present, and `rustc` otherwise
* Swift `(.swift)`
* TypeScript `(.ts)`

If `--docker` is set on the command line, each of these environments will run inside a specific docker container.

Otherwise, the development environments on your local machine will be used.

## Install and run from $PATH

```bash
# Install
$ npm i -g --production nbk

# Run
$ nbk path/to/notebooks
# Or
$ nbk --notebooks path/to/notebooks
```

## Install and run from source

```bash
# Install
$ git clone https://github.com/netgusto/nodebook
$ cd nodebook
$ npm install --production

# Run
$ node . --notebooks path/to/notebooks
```

## Install and run from source as an electron app

```bash
# Install
$ git clone https://github.com/netgusto/nodebook
$ cd nodebook
$ npm install

# Run
$ npm run electron -- --notebooks path/to/notebooks
```

## Usage

### Create a Notebook

Click on the **+ Notebook** button on the Home page, then select the language of the notebook to be created.

Once on the notebook edition page, you can rename the notebook by clicking on it's name.

Notebooks are created in the directory specified by the parameter `--notebooks`.

### Create a Notebook manually

In the directory where you want your notebooks to be stored, simply create a folder containing a file named `{index|main}.{js,py,c,cpp,...}`.

The notebook's name will be the name of the folder. The notebook language is determined automatically.

### Command line options

* **--notebooks**: path to notebook folders; *required*
* **--bindaddress**: IP address the http server should bind to; defaults to `127.0.0.1`
* **--port**: Port used by the application; defaults to `8000`
* **--docker**: Execute code in disposable docker containers instead of local system; defaults to `false`

## ⚠️ A bit of warning ⚠️

Do not run this on a port open to public traffic! Doing so would allow remote code execution on your machine.

By default, the server binds to `127.0.0.1`, which allows connection from the localhost only. You can override the bind address using `--bindaddress`, but do it only if you know what you're doing.

## Develop

To iterate on the code:

```bash
$ npm install
$ PARAMS="--notebooks path/to/notebooks" npm run dev
```

To build:

```bash
$ npm run build
```

To test:

```bash
$ npm test
```
