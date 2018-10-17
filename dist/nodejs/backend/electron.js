"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const start_1 = require("./start"); // main express app
let mainWindow;
function createWindow() {
    return __awaiter(this, void 0, void 0, function* () {
        let info;
        try {
            info = yield start_1.default();
            if (info) {
                const { parameters } = info;
                mainWindow = new electron_1.BrowserWindow({
                    width: 1280,
                    height: 720
                });
                mainWindow.loadURL(`http://${parameters.bindaddress}:${parameters.port}/`);
                mainWindow.focus();
            }
            else {
                electron_1.app.quit();
            }
        }
        catch (e) {
            console.log(e.message);
            electron_1.app.quit();
        }
    });
}
electron_1.app.on('ready', createWindow);
electron_1.app.on('window-all-closed', () => {
    electron_1.app.quit();
});
electron_1.app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
