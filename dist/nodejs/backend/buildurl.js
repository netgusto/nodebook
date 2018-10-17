"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function buildUrl(name, params = {}) {
    function replaceParamsInUrl(template, values) {
        return template.replace(/\:(.*?)(\/|$)/g, (_, name, delimiter) => {
            return ((name in values) ? encodeURIComponent(values[name]) : '') + delimiter;
        });
    }
    switch (name) {
        case 'home': return '/';
        case 'notebook': return replaceParamsInUrl('/notebook/:name', params);
        case 'notebooknew': return '/api/notebook/new';
        case 'notebooksetcontent': return replaceParamsInUrl('/api/notebook/:name/setcontent', params);
        case 'notebookexec': return replaceParamsInUrl('/api/notebook/:name/exec', params);
        case 'notebookstop': return replaceParamsInUrl('/api/notebook/:name/stop', params);
        case 'notebookrename': return replaceParamsInUrl('/api/notebook/:name/rename', params);
    }
    return undefined;
}
exports.buildUrl = buildUrl;
