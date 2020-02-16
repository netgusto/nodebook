# nodebook

Nodebook - Multi-Language REPL with Web UI + CLI code runner

Useful to practice algorithms and datastructures for coding interviews.

## What is it?

Nodebook is an in-browser REPL supporting many programming languages. Code's on the left, Console's on the right. Click "Run" or press <kbd>Ctrl</kbd>+<kbd>Enter</kbd> or <kbd>Cmd</kbd>+<kbd>Enter</kbd> to run your code.
Code is automatically persisted on the file system.

**You can also use Nodebook directly on the command line**, running your notebooks upon change.

![nodebook](https://user-images.githubusercontent.com/4974818/45320903-2cdec280-b544-11e8-9b2e-067b646de751.png)

A notebook is a folder containing an `{index|main}.{js,py,c,cpp,...}` file. The homepage lists all of the available notebooks.

![home](https://user-images.githubusercontent.com/4974818/45383977-fde05380-b60c-11e8-91cc-06548dd4fae8.png)

## Supported environments

* C11 `(.c)`
* C++14 `(.cpp)`
* C# `(.cs)`
* Clojure `(.clj)`
* Elixir `(.ex)`
* Fsharp `(.fs)`
* Go `(.go)`
* Haskell `(.hs)`
* Java `(.java)`
* NodeJS `(.js)`
* Lua `(.lua)`
* OCaml `(.ml)`
* PHP `(.php)`
* Python 3 `(.py)`
* R `(.r, .R)`
* Ruby `(.rb)`
* Rust `(.rs)` — Uses `cargo run` if `Cargo.toml` is present, and `rustc` otherwise
* Swift `(.swift)`
* TypeScript `(.ts)`

If `--docker` is set on the command line, each of these environments will run inside a specific docker container.

Otherwise, the local toolchains will be used.

## Install from release

Head to [Releases](https://github.com/netgusto/nodebook/releases/latest) and download the binary built for your system (mac, linux).

Rename it to `nodebook` and place it in your path.

## Install from source

Building requires go.

```bash
$ make deps
$ make install
# nodebook should be available under $GOPATH/bin/nodebook or $GOBIN/nodebook
```

## Run with Web UI

```
# With dockerized toolchains
$ nodebook --docker path/to/notebooks

# With local toolchains
$ nodebook path/to/notebooks
```

# Run on CLI (watch and run mode)

```
$ nodebook cli --docker path/to/notebooks
# Or
$ nodebook cli path/to/notebooks
```

## Usage

### Create a Notebook (Web UI)

Click on the **+ Notebook** button on the Home page, then select the language of the notebook to be created.

Once on the notebook edition page, you can rename the notebook by clicking on it's name.

Notebooks are created in the directory specified by the parameter `--notebooks`.

### Create a Notebook manually (WebUI, CLI)

In the directory where you want your notebooks to be stored, simply create a folder containing a file named `{index|main}.{js,py,c,cpp,...}`.

The notebook's name will be the name of the folder. The notebook language is determined automatically.

### Command line options

* **--docker**: Execute code in disposable docker containers instead of local system; defaults to `false`

**Web UI only**:

* **--bindaddress**: IP address the http server should bind to; defaults to `127.0.0.1`
* **--port**: Port used by the application; defaults to `8000`

### Notebook environment

If your notebook dir contains a `.env` file, the corresponding environment will be set up during notebook execution.

Exemple `.env`:

```
HELLO=World!
```

More information about the expected file format here: <https://github.com/motdotla/dotenv#rules>

## ⚠️ A bit of warning ⚠️

Do not run the Web UI on a port open to public traffic! Doing so would allow remote code execution on your machine.

By default, the server binds to `127.0.0.1`, which allows connection from the localhost only. You can override the bind address using `--bindaddress`, but do it only if you know what you're doing.

