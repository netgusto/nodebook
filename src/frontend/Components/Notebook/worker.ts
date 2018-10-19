onmessage = function(e: MessageEvent) {
    switch(e.data.action) {
        case 'exec': {
            execAction(e.data.url);
        }
    }
}

function consoleLogIfRunning(msg: string, chan: string) {
    (postMessage as any)({
        action: 'consoleLogIfRunning',
        payload: {
            msg,
            chan,
        }
    });
}

function notifyExecEnded() {
    (postMessage as any)({
        action: 'execEnded',
    });
}

function execAction(url: string) {
    return fetch(url, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
    })
    .then(res => {
        if (!res.body) {
            // response not streamable; use it in one piece

            let hasLastNewLine = true;
            return res.text()
                .then(text => {
                    text.split('\n').map(jsonline => {
        
                    if (jsonline.trim().length === 0) return;

                    const data = JSON.parse(jsonline);
                    const txt = JSON.parse(data.data);
                    const lastnl = txt.lastIndexOf('\n');
                    hasLastNewLine = (lastnl === txt.length - 1);
                    consoleLogIfRunning(txt, data.chan);
                    });

                    return { hasLastNewLine };
                });
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
                            consoleLogIfRunning(txt, data.chan);
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
            consoleLogIfRunning('%\n', 'forcednl');
        }

        consoleLogIfRunning('--- Done.\n\n', 'info');
        notifyExecEnded();
    })
    .catch(err => {
        consoleLogIfRunning('\n--- An error occurred during execution.\n\n', 'stderr');
        notifyExecEnded();
    });
}