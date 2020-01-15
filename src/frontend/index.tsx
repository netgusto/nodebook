import * as React from 'react';
import * as ReactDOM from 'react-dom';

import ApiClient from './ApiClient';
import { Route as RouteType } from "./types";

import App from './Components/App';

const apiClient = new ApiClient();

(window as any).main = (function main(element: HTMLElement, route: RouteType, params: any) {
    ReactDOM.render(
        <App apiClient={apiClient} route={route} {...params} />,
        element,
    );
});