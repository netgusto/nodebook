module.exports = { buildUrl };

function buildUrl(name, params) {

    function replaceParamsInUrl(template, values) {
        return template.replace(/\:(.*?)(\/|$)/g, (_, name, delimiter) => {
            return ((name in values) ? encodeURIComponent(values[name]) : '') + delimiter;
        });
    }

    function forgeUrl() {
        switch (name) {
            case 'home': return '/';
            case 'notebook': return replaceParamsInUrl('/notebook/:name', params);
            case 'notebooksetcontent': return replaceParamsInUrl('/notebook/:name/setcontent', params);
            case 'notebookexec': return replaceParamsInUrl('/notebook/:name/exec', params);
        }

        return undefined;
    }

    return forgeUrl();

}



