import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { Route as RouteType } from "./types";

import App from './Components/App';

(window as any).main = (function main(element: HTMLElement, route: RouteType, params: any) {
    ReactDOM.render(
        <App route={route} {...params} />,
        element,
    );
});