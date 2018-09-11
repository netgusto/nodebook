import * as React from 'react';
import { Notebook } from "../../types";

import {UnControlled as CodeMirror} from 'react-codemirror2'
const CM = CodeMirror as any;

import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/monokai.css';

import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/clike/clike';
import 'codemirror/mode/go/go';
import 'codemirror/mode/haskell/haskell';
import 'codemirror/mode/lua/lua';
import 'codemirror/mode/php/php';
import 'codemirror/mode/python/python';
import 'codemirror/mode/r/r';
import 'codemirror/mode/ruby/ruby';
import 'codemirror/mode/rust/rust';
import 'codemirror/mode/swift/swift';

import 'codemirror/keymap/sublime';

import 'codemirror/addon/selection/active-line';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/scroll/annotatescrollbar';
import 'codemirror/addon/search/matchesonscrollbar';
import 'codemirror/addon/search/searchcursor';
import 'codemirror/addon/search/match-highlighter';
import 'codemirror/addon/fold/indent-fold';
import 'codemirror/addon/scroll/scrollpastend';

import "./style.scss";

export interface Props {
    notebook: Notebook;
    homeurl: string;
}

export interface State {
    autoclear: boolean;
}

export default class NotebookComponent extends React.Component<Props, State> {

    private props: Props;
    private state: State = {
        autoclear: false,
    };

    private boundHandleKeyDown: EventListener;
    private editorvalue: string;

    constructor(props: Props) {
        super(props);
        this.boundHandleKeyDown = this.handleKeyDown.bind(this);
        this.editorvalue = props.notebook.content;
    }

    componentWillMount(props: Props) {
        document.addEventListener('keydown', this.boundHandleKeyDown);
    }

    componentDidMount() {
        consoleLog('Ready.\n', 'info');
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.boundHandleKeyDown);
    }

    handleKeyDown(event) {
        if ((event.metaKey || event.ctrlKey) && event.keyCode == 13) {          // cmd + Enter          
            event.preventDefault();
            this.execNotebook();
        } else if ((event.metaKey || event.ctrlKey) && event.key == 's') {      // cmd + S

            const { notebook } = this.props;

            event.preventDefault();
            persist(notebook, this.editorvalue).then(() => this.execNotebook());
        }
    }

    render() {
        const { notebook, homeurl } = this.props;
        const { autoclear } = this.state;

        return (
            <div className="notebook-app">
                <div id="layout">
                    <div id="top">
                        <div id="btn-run">
                            <button onClick={() => this.execNotebook()}>Run&nbsp;&nbsp;▶</button>
                        </div>

                        <div id="notebook-header">
                            <span className="notebook-name">{notebook.name}</span>
                            <span className="notebook-recipe">{notebook.recipe.name}</span>
                        </div>

                        <div id="console-options">
                            <label><input type="checkbox" checked={autoclear} onChange={e => { this.setState({ autoclear: e.target.checked }); }} /> Clear console every run</label>
                        </div>

                        <div id="btn-home">
                            <button onClick={() => document.location.href = homeurl}>Home&nbsp;&nbsp;🏠</button>
                        </div>
                    </div>
                    <div id="left">
                        <div id="code">
                            <CM
                                value={notebook.content}
                                options={{
                                    mode: notebook.recipe.cmmode,
                                    theme: 'monokai',
                                    lineNumbers: true,
                                    lineWrapping: true,
                                    styleActiveLine: true,
                                    matchBrackets: true,
                                    indentUnit: 4,
                                    scrollPastEnd: true,
                                    keyMap: 'sublime',

                                    extraKeys: {
                                        "Tab": (cm) => cm.execCommand("indentMore"),
                                        "Shift-Tab": (cm) => cm.execCommand("indentLess"),
                                        "Cmd-Enter": (cm) => {},
                                    }
                                }}
                                onChange={(_, __, value) => {
                                    this.editorvalue = value;
                                    debouncedPersist(notebook, value);
                                }}
                            />
                        </div>
                    </div>
                    <div id="gutter"></div>
                    <div id="right">
                        <div id="console"></div>
                    </div>
                </div>
            </div>
        );
    }

    protected execNotebook() {

        const { autoclear } = this.state;
        const { notebook } = this.props;

        if (autoclear) consoleClear();
    
        consoleLog('--- Running...\n', 'info');
        const { execurl } = notebook;
    
        return window.fetch(execurl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        })
        .then(res => {
            if (!res.body) {
                // response not streamable; use it in one piece
                return res.text()
                    .then(text => text.split('\n').map(jsonline => {
            
                        if (jsonline.trim().length === 0) return;
    
                        const data = JSON.parse(jsonline);
                        consoleLog(JSON.parse(data.data), data.chan);
                    }));
            } else {
                return new Promise((resolve, reject) => {
                    const reader = res.body.getReader();
                    const decoder = new TextDecoder("utf-8");
                    let hasLastNewLine = true;
                    function pump() {
                        reader.read().then(({ done, value }) => {
                            if (done) {
                                resolve({ hasLastNewLine });
                                return;
                            }
                
                            decoder.decode(value).split('\n').map(jsonline => {
                
                                if (jsonline.trim().length === 0) return;
    
                                const data = JSON.parse(jsonline);
                                const txt = JSON.parse(data.data);
                                const lastnl = txt.lastIndexOf('\n');
                                hasLastNewLine = (lastnl === txt.length - 1);
                                consoleLog(JSON.parse(data.data), data.chan);
                            });
                            
                            // Get the data and send it to the browser via the controller
                            pump();
                        });
                    }
    
                    pump();
                });
            }
        })
        .then(({ hasLastNewLine }) => {
            if (!hasLastNewLine) {
                consoleLog('%\n', 'forcednl');
            }
    
            consoleLog('--- Done.\n\n', 'info');
        });
    }
}



function consoleLog(msg: string, cls: string) {
    const consoleObj = document.getElementById('console');
    consoleObj.innerHTML += '<span class="' + cls + '">' + msg + '</span>';
    consoleObj.scrollTop = consoleObj.scrollHeight;
}

function consoleClear() {
    const consoleObj = document.getElementById('console');
    consoleObj.innerHTML = '';
}

function persist(notebook: Notebook, value: string) {
    return window.fetch(notebook.persisturl, {
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

function debounce(func: Function, wait: Number = 100) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(this, args);
        }, wait);
    };
}
