import * as React from 'react';
import cx from 'classnames';
import { AllHtmlEntities as Entities } from 'html-entities';
import Convert from 'ansi-to-html';

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

import { Notebook } from "../../types";
import "./style.scss";

export interface Props {
    notebook: Notebook;
    homeurl: string;
    renamenotebookurl: string;
}

export interface State {
    autoclear: boolean;
    newname: string|undefined;
    running: boolean;
}

export default class NotebookComponent extends React.Component<Props, State> {

    props: Props;
    state: State = {
        autoclear: false,
        newname: undefined,
        running: false,
    };

    private boundHandleKeyDown: EventListener;
    private editorvalue: string;
    private entities: Entities;
    private ansiConvert: Convert;
    private console: HTMLElement;

    constructor(props: Props) {
        super(props);
        this.boundHandleKeyDown = this.handleKeyDown.bind(this);
        this.editorvalue = props.notebook.content;
        this.entities = new Entities();
        this.ansiConvert = new Convert();
    }

    componentWillMount() {
        document.addEventListener('keydown', this.boundHandleKeyDown);
    }

    componentDidMount() {
        this.consoleLog('Ready.\n', 'info');
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
        const { autoclear, newname, running } = this.state;

        return (
            <div className="notebook-app">
                <div id="layout">
                    <div id="top">
                        <div id="btn-run">
                            <button className={cx('bigbutton', 'run', { running })} onClick={() => running ? this.stopExecution() : this.execNotebook()}>
                                {running ? <span>Stop&nbsp;&nbsp;■</span> : <span>Run&nbsp;&nbsp;▶</span>}
                            </button>
                        </div>

                        <div id="notebook-header">
                            <span
                                contentEditable={true}
                                className="notebook-name"
                                onBlur={e => this.onNotebookNameCommit()}
                                onInput={e => this.onNotebookNameChange((e.target as HTMLElement).innerText)}
                            >
                                {newname === undefined ? notebook.name : newname}
                            </span>
                            <span className="notebook-recipe">{notebook.recipe.name}</span>
                        </div>

                        <div id="console-options">
                            <label><input type="checkbox" checked={autoclear} onChange={e => { this.setState({ autoclear: e.target.checked }); }} /> Clear console every run</label>
                        </div>

                        <div id="btn-home">
                            <button className="bigbutton" onClick={() => document.location.href = homeurl}>Home&nbsp;&nbsp;🏠</button>
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
                        <div id="console" ref={el => this.console = el}></div>
                    </div>
                </div>
            </div>
        );
    }

    private sanitizeName(name: string) {
        if (typeof name !== 'string') throw new Error('The notebook name should be a string');
    
        name = name.
            replace(/\.{2,}/g, '.').
            replace(/\\/g, '_').
            replace(/\//g, '_').
            replace(/[^a-zA-Z0-9àâäéèëêìïîùûüÿŷ\s-_\.]/g, '').
            replace(/\s+/g, ' ').
            trim();
        
        if (name === '' || name[0] === '.') throw new Error('Invalid name');

        return name;
    }

    private onNotebookNameChange(newname) {
        this.setState({ newname });
    }

    private onNotebookNameCommit() {

        const { newname } = this.state;
        const { notebook, renamenotebookurl } = this.props;

        if (newname === undefined) return;

        // Sanitize name

        let sanitizedName;
        try {
            sanitizedName = this.sanitizeName(newname);
        } catch(e) {
            this.setState({ newname: undefined });
            window.setTimeout(() => alert('Invalid name.'), 10);
            return;
        }

        if (sanitizedName === notebook.name) {
            this.setState({ newname: undefined });
            return;
        }

        this.setState({ newname: sanitizedName });

        // Persist name change

        return window.fetch(renamenotebookurl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                newname: sanitizedName,
            })
        })
        .then(res => res.json())
        .then(({ url }) => document.location.href = url)
        .catch(_ => alert('Error: Notebook could not be renamed.'));
    }

    private stopExecution() {
        const { running } = this.state;
        if (!running) return; 

        const { notebook } = this.props;
        const { stopurl } = notebook;

        return window.fetch(stopurl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        })
        .then(() => {
            this.consoleLog('--- Execution stopped.\n\n', 'info');
            this.setState({ running: false });
        })
        .catch(() => {
            alert('An error occured when stopping the current execution.');
        });
    }

    private execNotebook() {

        const { autoclear, running } = this.state;
        const { notebook } = this.props;

        if (running) return;

        this.setState({ running: true });

        if (autoclear) this.consoleClear();
    
        this.consoleLog('--- Running...\n', 'info');
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
                        if (this.state.running) this.consoleLog(JSON.parse(data.data), data.chan);
                    }));
            } else {
                return new Promise((resolve, reject) => {
                    const reader = res.body.getReader();
                    const decoder = new TextDecoder("utf-8");
                    let hasLastNewLine = true;
                    const pump = () => {
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
                                if (this.state.running) this.consoleLog(JSON.parse(data.data), data.chan);
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
                if (this.state.running) this.consoleLog('%\n', 'forcednl');
            }
    
            if (this.state.running) this.consoleLog('--- Done.\n\n', 'info');
            this.setState({ running: false });
        })
        .catch(err => {
            if (this.state.running) this.consoleLog('\n--- An error occurred during execution.\n\n', 'stderr');
            this.setState({ running: false });
        });
    }

    consoleLog(msg: string, cls: string) {
        this.console.innerHTML += '<span class="' + cls + '">' + this.ansiConvert.toHtml(this.entities.encode(msg)) + '</span>';
        this.console.scrollTop = this.console.scrollHeight;
    }

    consoleClear() {
        this.console.innerHTML = '';
    }
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
