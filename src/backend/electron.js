const { app, BrowserWindow } = require('electron');
const { sanitizeParameters } = require('./sanitizeParameters');

require('./index'); // main express app

let win;

async function createWindow() {
    let parameters;
    try {
        parameters = await sanitizeParameters(process.argv.slice(2));
    } catch(e) {
        return console.error(e.message);
    }

    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720
    });

    mainWindow.loadURL(`http://${parameters.bindaddress}:${parameters.port}/`);
    mainWindow.focus();
}

app.on('ready', createWindow);
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (win === null) {
        createWindow();
    }
});
