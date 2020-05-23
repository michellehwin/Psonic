const electron = require('electron');
const url = require('url');
const path = require("path");
const Store = require('./store.js');
const generateApprovedPassword = require('./generation.js');

// SET ENV
process.env.NODE_ENV = 'development';

const{app, BrowserWindow, Menu, ipcMain} = electron;

let mainWindow;
let addWindow;

var store = new Store({
    configName: 'passwords'
});

// Listen for app to be ready
app.on('ready', function () {
    //Create a window
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        }
    });
    // Load html into window
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'mainWindow.html'),
        protocol:"file:",
        slashes:true
    }));
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('data:add', store);
    });
    //Quit app when closed
    mainWindow.on('closed', function () {
        app.quit();
    });
    //Build menu from template
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    //Insert Menu
    Menu.setApplicationMenu(mainMenu);
});

// Handle create add window
function createAddWindow() {
    //Create a window
    addWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        },
        width: 500,
        height: 300,
        title: 'Add Password'
    });
    // Load html into window
    addWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'addWindow.html'),
        protocol:"file:",
        slashes:true
    }));
    // Garbage collection handle
    addWindow.on('close', function () {
        addWindow = null;
        mainWindow.webContents.send('data:add', store);
    })
}

// Catch password:add
ipcMain.on('password:add', function (e, username, website) {
    //generate pass and send to mainWindow
    const password = generateApprovedPassword(15, 'placeholder', [0, 1, 2]);
    store.add(website, username, password);
    mainWindow.webContents.send('password:add', username, website, password);
    addWindow.close();
});

//Create menu template
const mainMenuTemplate = [
    {
    label:'File',
    submenu:[
        {
            label: 'Add Password',
            accelerator: process.platform == 'darwin' ? 'Command + A' : 'Ctrl+A',
            click() {
                createAddWindow();
            }
        },
        {
            label: 'Clear Passwords',
            click() {
                mainWindow.webContents.send('password:clear')
            }
        },
        {
            label: 'Quit',
            accelerator: process.platform == 'darwin' ? 'Command + Q' : 'Ctrl+Q',
            click() {
                app.quit();
            }
        }
    ]
    }
];

// If mac, add empty object to menu
if (process.platform == 'darwin') {
    mainMenuTemplate.unshift({});
}

// Add dev tools items if not in production
if (process.env.NODE_ENV !== 'production') {
    mainMenuTemplate.push(
        {
            label: 'Developer Tools',
            submenu: [
                {
                    label: 'Toggle DevTools', 
                    accelerator: process.platform == 'darwin' ? 'Command + I' : 'Ctrl+I',
                    click(item, focusedWindow) {
                        focusedWindow.toggleDevTools();
                    }
                },
                {
                    role: 'reload'
                }
            ]
        }
    )
}