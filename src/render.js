const { buildUrl } = require('./buildurl');

module.exports = { renderHomePage, renderNotebook };

function renderHomePage({ notebooks }) {
    let html = [];
    html.push('<ul>');
    notebooks.forEach(notebook => {
        html.push('<li><a href="' + buildUrl('notebook', { name: notebook.name }) + '">' + notebook.name + '</a></li>');
    });
    html.push('</ul>');

    return html.join('');
}

function renderNotebook({ name, abspath, content }) {
    const persisturl = buildUrl('notebooksetcontent', { name });
    const execurl = buildUrl('notebookexec', { name });
    const homeurl = buildUrl('home');

    const html = `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<title>${escapeHtml(name)}</title>
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.40.0/codemirror.min.css">
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.40.0/addon/hint/show-hint.min.css">
	<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.40.0/codemirror.min.js"></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.40.0/mode/javascript/javascript.min.js"></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.40.0/addon/selection/active-line.min.js"></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.40.0/addon/edit/matchbrackets.min.js"></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.40.0/addon/edit/closebrackets.min.js"></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.40.0/addon/scroll/annotatescrollbar.min.js"></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.40.0/addon/search/matchesonscrollbar.min.js"></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.40.0/addon/search/searchcursor.min.js"></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.40.0/addon/search/match-highlighter.min.js"></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.40.0/addon/fold/indent-fold.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.40.0/addon/hint/show-hint.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.40.0/addon/hint/javascript-hint.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.40.0/addon/scroll/scrollpastend.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.40.0/keymap/sublime.min.js"></script>

	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.40.0/theme/monokai.min.css">

    <style type="text/css">
        body { margin: 0; padding: 0; background: #272822; font-size: 14px; }
        pre, code {
            font-family: 'Roboto Mono', Menlo, 'Ubuntu Mono', Monaco, Consolas, 'source-code-pro', monospace;
        }

        .CodeMirror {
			width: 100%;
            height: calc(100vh - 50px);
            
            font-family: 'Roboto Mono', Menlo, 'Ubuntu Mono', Monaco, Consolas, 'source-code-pro', monospace;
            line-height: 1.414;
        }

        .CodeMirror-linenumber {
            padding-right: 20px;
        }

        .cm-s-monokai .CodeMirror-linenumber {
            color: #777;
        } 

        #layout {
            display: grid;
            grid-template-rows: 50px auto;
            grid-template-columns: auto 5px 40%;
            grid-template-areas: "top top top"
                                 "code gutter console";
        }

        #top {
            grid-area: top;
            background-color: #333;
            padding: 10px;
            vertical-align: middle;

            display: grid;
            grid-template-columns: 100px auto 100px;
            grid-template-areas: "btn-run notebook-name btn-home";
        }

        #top button {
            height: 30px;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 1.1rem;
            font-weight: bold;
            cursor: pointer;
        }

        #top #btn-run {
            grid-area: btn-run;
        }

        #top #notebook-name {
            grid-area: notebook-name;

            color: white;
            font-weight: bold;
            font-size: 20px;
            line-height: 30px;
            font-family: Helvetica Neue, Helvetica, Arial, sans-serif;
        }

        #top #btn-home {
            grid-area: btn-home;
            text-align: right;
        }

        #top #btn-run button {
            width: 90px;
            background-color: rgb(107, 183, 175);
        }

        #top #btn-home button {
            background-color: #9b59b6;
        }

        #left {
            grid-area: code;
        }

        #gutter {
            grid-area: gutter;
            background-color: #333;
        }

        #right {
            grid-area: console;
        }

        #console {
            color: #f8f8f2;
            width: 100%;
            height: calc(100vh - 50px);
            overflow: scroll;
            unicode-bidi: embed;
            font-family: 'Roboto Mono', Menlo, 'Ubuntu Mono', Monaco, Consolas, 'source-code-pro', monospace;
            white-space: pre;
            margin-bottom: 20px;
            padding-left: 10px;
        }

        #console .stderr { color: red; }
        #console .info { color: #888; }
	</style>
</head>

<body>
    <div id="layout">
        <div id="top">
            <div id="btn-run">
                <button>Run&nbsp;&nbsp;▶</button>
            </div>

            <div id="notebook-name">
                ${name}
            </div>

            <div id="btn-home">
                <button>Home&nbsp;&nbsp;🏠</button>
            </div>
        </div>
        <div id="left">
            <div id="code"></div>
        </div>
        <div id="gutter"></div>
        <div id="right">
            <div id="console"></div>
        </div>
    </div>

    <script type="text/javascript">
        function consoleLog(msg, cls) {
            const consoleObj = document.getElementById('console');
            consoleObj.innerHTML += '<span class="' + cls + '">' + msg + '</span>';
            consoleObj.scrollTop = consoleObj.scrollHeight;
        }

        function persist(value) {
            window.fetch(${JSON.stringify(persisturl)}, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: value,
                })
            });
        }

        const debouncedPersist = debounce(persist, 400);

        function debounce(func, wait = 100) {
            let timeout;
            return function (...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    func.apply(this, args);
                }, wait);
            };
        }

        function goToHome() {
            document.location.href = ${JSON.stringify(homeurl)};
        }

        function exec() {
            consoleLog('--- Running...\\n', 'info');
            window.fetch(${JSON.stringify(execurl)}, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
            })
            .then(res => {
                const reader = res.body.getReader();

                const stream = new ReadableStream({

                    start(controller) {

                        function push() {

                            reader.read().then(({ done, value }) => {
                                if (done) {
                                    controller.close();
                                    consoleLog('--- Done.\\n', 'info');
                                    return;
                                }

                                new TextDecoder("utf-8").decode(value).split('\\n').map(jsonline => {

                                    if (jsonline.trim().length === 0) return;

                                    const data = JSON.parse(jsonline);
                                    consoleLog(JSON.parse(data.data), data.chan);
                                });
                                
                                // Get the data and send it to the browser via the controller
                                push();
                            });
                        };
                        
                        push();
                    }
                });
            });
        }
        
		window.onload = function() {

            document.querySelectorAll('#top #btn-run button').forEach(button => button.addEventListener('click', exec));
            document.querySelectorAll('#top #btn-home button').forEach(button => button.addEventListener('click', goToHome));
            document.addEventListener('keydown', event => {
                if ((event.metaKey || event.ctrlKey) && event.keyCode == 13) {
                    // cmd + Enter
                    exec();
                }
            });

			const editor = CodeMirror(document.getElementById("code"), {
				mode: "javascript",
				theme: "monokai",
				lineWrapping: true,
				lineNumbers: true,
				styleActiveLine: true,
                matchBrackets: true,
                indentUnit: 4,
                value: ${JSON.stringify(content)},
                scrollPastEnd: true,

				extraKeys: {
                    "Tab": (cm) => cm.execCommand("indentMore"),
                    "Shift-Tab": (cm) => cm.execCommand("indentLess"),
                    // "Cmd-Enter": exec,
                    "Cmd-S": (cm) => persist(cm.getValue()),
                }
            });
            
            editor.on('changes', (cm) => debouncedPersist(cm.getValue()));

            consoleLog('Ready.\\n', 'info');
		};
	</script>
</body>

</html>
`;

    return html;

}

function escapeHtml(text) {
    var map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };

    return text.replace(/[&<>"']/g, function (m) { return map[m]; });
}