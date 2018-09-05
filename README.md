# nodebook

Nodebook - Minimalist Node REPL with web UI

## What is it?

It's an in-browser REPL for Node.

Code's on the left, Console on the right. Click "Run" or press "Ctrl+Enter" or "Cmd+Enter" to run your code.
The code is automatically persisted on the file system.

![nodebook](https://user-images.githubusercontent.com/4974818/45084039-8f2b6380-b0fd-11e8-94d4-dadcab34c7f6.png)

The home lists the available Nodebooks. A Nodebook is a folder containing an `index.js` file.

![home](https://user-images.githubusercontent.com/4974818/45084276-3c9e7700-b0fe-11e8-9ed0-d2b7cb5b7bb3.png)

## Installation

```bash
$ git clone https://github.com/netgusto/nodebook
$ cd nodebook
$ npm install
```

## Usage

### Create a Nodebook

In a directory where your Nodebooks will be stored, simply create a folder containing a file named `index.js`.
The dir name will be the nodebook name.

### Run the REPL

```bash
# Default usage; local execution, bound to 127.0.0.1:8000
$ node . --notebooks path/to/notebooks
# open http://127.0.0.1:8000 in a browser
```

```bash
# Set bindaddress and port
$ node . --notebooks path/to/notebooks --bindaddress 0.0.0.0 -port 12000
```

```bash
# Execute code in disposable docker containers (node:alpine)
$ node . --notebooks path/to/notebooks --docker
```

#### Command line options

* **--notebooks**: path to notebook folders; required
* **--bindaddress**: IP address the http server should bind to; defaults to `127.0.0.1`
* **--port**: Port used by the application; defaults to `8000`
* **--docker**: Execute code in disposable docker containers instead of local system's Node; defaults to `false`
