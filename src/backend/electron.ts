import { app, BrowserWindow } from 'electron';

import start from './start'; // main express app

let mainWindow: BrowserWindow|null;

async function createWindow() {
    let info;

    try {
        info = await start();
        if (info) {
            const { parameters } = info;

            mainWindow = new BrowserWindow({
                width: 1280,
                height: 720
            });

            mainWindow.loadURL(`http://${parameters.bindaddress}:${parameters.port}/`);
            mainWindow.focus();
        } else {
            app.quit();
        }
    } catch(e) {
        console.log(e.message);
        app.quit();
    }
}

app.on('ready', createWindow);
app.on('window-all-closed', () => {
    app.quit();
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
