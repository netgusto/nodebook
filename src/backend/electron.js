const { app, BrowserWindow } = require('electron');

require('./index'); // main express app

let win;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        autoHideMenuBar: true,
        useContentSize: true,
        resizable: false
    });
    mainWindow.loadURL('http://localhost:8000/');
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
