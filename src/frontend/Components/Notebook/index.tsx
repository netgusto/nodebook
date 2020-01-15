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
import 'codemirror/mode/clojure/clojure';
import 'codemirror/mode/go/go';
import 'codemirror/mode/haskell/haskell';
import 'codemirror/mode/lua/lua';
import 'codemirror/mode/mllike/mllike';
import 'codemirror/mode/php/php';
import 'codemirror/mode/python/python';
import 'codemirror/mode/r/r';
import 'codemirror/mode/ruby/ruby';
import 'codemirror/mode/rust/rust';
import 'codemirror/mode/swift/swift';
import 'codemirror/mode/swift/swift';
import 'codemirror-mode-elixir';

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

import { Notebook, ApiClient } from "../../types";
import "./style.scss";

export interface Props {
    apiClient: ApiClient,
    notebook: Notebook;
    homeurl: string;
    renamenotebookurl: string;
}

export interface State {
    autoclear: boolean;
    newname: string|undefined;
    running: boolean;
    dragging: boolean;
    codeWidth: number;
}

export default class NotebookComponent extends React.Component<Props, State> {

    props: Props;
    state: State = {
        autoclear: false,
        newname: undefined,
        running: false,
        dragging: false,
        codeWidth: 60,
    };

    private boundHandleKeyDown: EventListener;
    private boundHandleMouseUp: EventListener;
    private boundHandleMouseDown: EventListener;
    private boundHandleMouseMove: EventListener;
    private editorvalue: string;
    private entities: any;
    private ansiConvert: Convert;
    private console: HTMLElement;

    private commWorker: Worker;

    constructor(props: Props) {
        super(props);
        this.boundHandleKeyDown = this.handleKeyDown.bind(this);
        this.boundHandleMouseDown = this.handleMouseDown.bind(this);
        this.boundHandleMouseUp = this.handleMouseUp.bind(this);
        this.boundHandleMouseMove = this.handleMouseMove.bind(this);
        this.onNotebookNameKeyDown = this.onNotebookNameKeyDown.bind(this);
        this.editorvalue = props.notebook.content;
        this.entities = new Entities();
        this.ansiConvert = new Convert();
    }

    // Pleasing TS
    setState(s: Partial<State>) { super.setState(s); }

    componentWillMount() {
        document.addEventListener('keydown', this.boundHandleKeyDown);
        document.addEventListener('mouseup', this.boundHandleMouseUp);
        document.addEventListener('mousemove', this.boundHandleMouseMove);
    }

    componentDidMount() {

        let i = 0;
        this.commWorker = new Worker('worker.ts');
        this.commWorker.onmessage = (e: MessageEvent) => {
            switch(e.data.action) {
                case 'consoleLogIfRunning': {
                    if (this.state.running) {
                        this.consoleLog(e.data.payload.msg, e.data.payload.chan);
                    }
                    break;
                }
                case 'execEnded': {
                    this.setState({ running: false });
                    break;
                }
            }
        };

        this.consoleLog('Ready.\n', 'info');
    }

    componentWillUnmount() {
        this.commWorker.terminate();
        document.removeEventListener('keydown', this.boundHandleKeyDown);
    }

    handleMouseDown(event) {
        this.setState({ dragging: true });
    }

    handleMouseUp(event) {
        this.setState({ dragging: false });
    }

    handleMouseMove(event) {
        if (this.state.dragging) {
            const percent = (event.pageX / window.innerWidth) * 100;
            this.setState({ codeWidth: percent });
        }
    }

    handleKeyDown(event) {
        if ((event.metaKey || event.ctrlKey) && event.keyCode === 13) {          // cmd + Enter          
            event.preventDefault();
            this.execNotebook();
        } else if ((event.metaKey || event.ctrlKey) && event.key === 's') {      // cmd + S

            const { notebook } = this.props;

            event.preventDefault();
            this.props.apiClient.persist(notebook, this.editorvalue).then(() => this.execNotebook());
        } else if (event.ctrlKey && event.key === 'c') {    // ctrl+c
            event.preventDefault();
            if (this.state.running) {
                this.stopExecution();
            }
        } else if (event.ctrlKey && event.key === 'r') {    // ctrl+r
            event.preventDefault();
            this.execNotebook();
        }
    }

    render() {
        const { notebook, homeurl } = this.props;
        const { autoclear, newname, running, codeWidth } = this.state;
        const layoutStyle = { gridTemplateColumns: `${codeWidth}% 5px calc(${100-codeWidth}% - 5px)` };

        return (
            <div className="notebook-app">
                <div id="layout" style={layoutStyle}>
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
                                onKeyDown={this.onNotebookNameKeyDown}
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
                                    scrollPastEnd: false,
                                    keyMap: 'sublime',

                                    extraKeys: {
                                        "Tab": (cm) => cm.execCommand("indentMore"),
                                        "Shift-Tab": (cm) => cm.execCommand("indentLess"),
                                        "Cmd-Enter": (cm) => {},
                                    }
                                }}
                                onChange={(_, __, value) => {
                                    this.editorvalue = value;
                                    this.props.apiClient.debouncedPersist(notebook, value);
                                }}
                            />
                        </div>
                    </div>
                    <div id="gutter" onMouseDown={this.boundHandleMouseDown}></div>
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
    private onNotebookNameKeyDown(event) {
        if (event.keyCode == 13) { // Enter
            event.preventDefault();
            this.onNotebookNameCommit();
            return;
        }
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

        return this.props.apiClient.rename(renamenotebookurl, sanitizedName)
        .then(res => res.json())
        .then(({ url }) => document.location.href = url)
        .catch(_ => alert('Error: Notebook could not be renamed.'));
    }

    private stopExecution() {
        const { running } = this.state;
        if (!running) return; 

        const { notebook } = this.props;
        
        return this.props.apiClient.stop(notebook)
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

        this.props.apiClient.getCsrfToken()
            .then((csrfToken) => {
                this.commWorker.postMessage({
                    action: 'exec',
                    url: execurl,
                    csrfToken
                });
            })
    }

    msgstack: any[] = []

    consoleLog(msg: string, cls: string) {
        this.msgstack.push({ msg, cls });
        window.requestAnimationFrame(() => {
            if (!this.msgstack.length) return;

            const maxchilds = 300;

            const allhtml = this.msgstack.map(m => {
                return '<span class="' + m.cls + '">' + this.ansiConvert.toHtml(this.entities.encode(m.msg)) + '</span>';
            }).join('');

            this.console.innerHTML += allhtml;

            const nbchilds = this.console.childElementCount;
            if(nbchilds > maxchilds) {
                for (let i = nbchilds - maxchilds; i >= 0; i--) {
                    this.console.children[i].remove()
                }
                const truncated = document.createElement('span');
                truncated.className = 'info';
                truncated.innerText = 'Output truncated (too big).\n';
                this.console.prepend(truncated);
            }

            this.console.scrollTop = this.console.scrollHeight;
            this.msgstack = [];
        });
    }

    consoleClear() {
        this.console.innerHTML = '';
    }
}
