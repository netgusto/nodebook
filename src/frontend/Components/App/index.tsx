import * as React from 'react';

import {
    Route as RouteType,
    NotebookHandle as NotebookHandleType,
    Notebook as NotebookType,
    ApiClient as ApiClientType
} from "../../types";

import Home, { Props as HomeProps } from "../Home";
import Notebook, { Props as NotebookProps } from "../Notebook";


interface Props {
    apiClient: ApiClientType,
    route: RouteType;
    notebooks?: NotebookHandleType[];
    notebook?: NotebookType;
    homeurl?: string;
}

export default function(props: Props) {
    const { route } = props;
    const NB = Notebook as any;
    switch(route) {
        case "home": return <Home {...(props as HomeProps)} />; break;
        case "notebook": return <NB {...(props as NotebookProps)} />; break;
        default: throw new Error("Unknown route:" + route);
    }
}