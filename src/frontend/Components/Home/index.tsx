import * as React from 'react';
import { NotebookHandle } from "../../types";

export interface Props {
    notebooks: NotebookHandle[];
}

export default function(props: Props) {
    const { notebooks } = props;

    return (
        <div className="home-app">
            <ul>
                {notebooks.map(notebook => (
                    <li key={notebook.name}><a href={notebook.url}>{notebook.name} ({notebook.recipe.name})</a></li>
                ))}
            </ul>
        </div>
    );
}