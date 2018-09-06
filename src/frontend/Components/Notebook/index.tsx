import * as React from 'react';
import { Notebook } from "../../types";

import {UnControlled as CodeMirror} from 'react-codemirror2'
const CM = CodeMirror as any;

import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/monokai.css';
import 'codemirror/addon/hint/show-hint.css';

import 'codemirror/mode/javascript/javascript';
import 'codemirror/keymap/sublime';

import 'codemirror/addon/selection/active-line';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/scroll/annotatescrollbar';
import 'codemirror/addon/search/matchesonscrollbar';
import 'codemirror/addon/search/searchcursor';
import 'codemirror/addon/search/match-highlighter';
import 'codemirror/addon/fold/indent-fold';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/hint/javascript-hint';
import 'codemirror/addon/scroll/scrollpastend';

import "./style.scss";

export interface Props {
    homeurl: string;
    notebook: Notebook;
}

export default class NotebookComponent extends React.Component<Props> {

    boundHandleKeyDown: EventListener;
    editorvalue: string;

    constructor(props: Props) {
        super(props);
        this.boundHandleKeyDown = this.handleKeyDown.bind(this);
        this.editorvalue = props.notebook.content;
    }

    componentWillMount(props: Props) {
        document.addEventListener('keydown', this.boundHandleKeyDown);
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.boundHandleKeyDown);
    }

    handleKeyDown(event) {
        if ((event.metaKey || event.ctrlKey) && event.keyCode == 13) {          // cmd + Enter
            const { notebook } = this.props;
            
            event.preventDefault();
            execNotebook(notebook);
        } else if ((event.metaKey || event.ctrlKey) && event.key == 's') {      // cmd + S

            const { notebook } = this.props;

            event.preventDefault();
            persist(notebook, this.editorvalue).then(() => execNotebook(notebook));
        }
    }

    render() {
        const { notebook, homeurl } = this.props;

        return (
            <div className="notebook-app">
                <div id="layout">
                    <div id="top">
                        <div id="btn-run">
                            <button onClick={() => execNotebook(notebook)}>Run&nbsp;&nbsp;▶</button>
                        </div>

                        <div id="notebook-name">{notebook.name}</div>

                        <div id="btn-home">
                            <button onClick={() => document.location.href = homeurl}>Home&nbsp;&nbsp;🏠</button>
                        </div>
                    </div>
                    <div id="left">
                        <div id="code">
                            <CM
                                ref={(el) => this.editor = el}
                                value={notebook.content}
                                options={{
                                    mode: 'javascript',
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
}

function execNotebook(notebook: Notebook) {
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
        const reader = res.body.getReader();
        const decoder = new TextDecoder("utf-8");
        function pump() {
            reader.read().then(({ done, value }) => {
                if (done) {
                    consoleLog('--- Done.\n', 'info');
                    return;
                }
    
                decoder.decode(value).split('\n').map(jsonline => {
    
                    if (jsonline.trim().length === 0) return;

                    const data = JSON.parse(jsonline);
                    consoleLog(JSON.parse(data.data), data.chan);
                });
                
                // Get the data and send it to the browser via the controller
                pump();
            });
        }

        pump();
    });
}

function consoleLog(msg: string, cls: string) {
    const consoleObj = document.getElementById('console');
    consoleObj.innerHTML += '<span class="' + cls + '">' + msg + '</span>';
    consoleObj.scrollTop = consoleObj.scrollHeight;
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
