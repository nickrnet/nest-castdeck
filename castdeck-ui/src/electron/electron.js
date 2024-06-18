// Module to control the application lifecycle and the native browser window.
const { app, BrowserWindow, ipcMain, protocol } = require("electron");
const path = require("path");
const url = require("url");
const { connect, ReceiverController } = require('chromecast-client');

const { channels } = require('./channels');
const BonjourClient = require('../bonjour-client/bonjour-client.cjs');


const bonjourClient = new BonjourClient();

let mainWindow = null;
let chromecastClient = null;
let receiver = null;
let searchingForDevices = false;
let selectedChromecastDevice = null;
const chromecastDevices = [];

// Create the native browser window.
function createWindow() {
  mainWindow = new BrowserWindow({
    title: "Nest CastDeck",
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      // webSecurity: false,
      // allowRunningInsecureContent: true,
      preload: path.resolve(path.join(__dirname, "preload.js"))
    },
    traceWarnings: true,
  });

  // In production, set the initial browser path to the local bundle generated
  // by the Create React App build process.
  // In development, set it to localhost to allow live/hot-reloading.
  const appURL = app.isPackaged
    ? url.format({
      pathname: path.join(__dirname, "index.html"),
      protocol: "file:",
      slashes: true,
    })
    : "http://localhost:3005";

  // Automatically open Chrome's DevTools in development mode.
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.loadURL(appURL);
}

// Setup a local proxy to adjust the paths of requested files when loading
// them from the local production bundle (e.g.: local fonts, etc...).
function setupLocalFilesNormalizerProxy() {
  protocol.registerHttpProtocol(
    "file",
    (request, callback) => {
      const url = request.url.substr(8);
      callback({ path: path.normalize(`${__dirname}/${url}`) });
    },
    (error) => {
      if (error) console.error("Failed to register protocol");
    }
  );
}

// This method will be called when Electron has finished its initialization and
// is ready to create the browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();
  setupLocalFilesNormalizerProxy();
  ipcMain.handle(channels.FETCH_DEVICES, fetchDevices);
  ipcMain.handle(channels.SELECTED_DEVICE, selectedDevice);
  ipcMain.handle(channels.START_CHROMECAST, startChromecast);
  ipcMain.handle(channels.STOP_CHROMECAST, stopChromecast);
  ipcMain.on(channels.DELIVERED_MESSAGE, (_event, value) => {});
  app.traceWarnings = true;

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS.
// There, it's common for applications and their menu bar to stay active until
// the user quits  explicitly with Cmd + Q.
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    bonjourClient.destroy();
    receiver.dispose();
    chromecastClient.close();
    app.quit();
  }
});

// If your app has no need to navigate or only needs to navigate to known pages,
// it is a good idea to limit navigation outright to that known scope,
// disallowing any other kinds of navigation.
const allowedNavigationDestinations = "";
app.on("web-contents-created", (event, contents) => {
  contents.on("will-navigate", (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);

    if (!allowedNavigationDestinations.includes(parsedUrl.origin)) {
      event.preventDefault();
    }
  });
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

function fetchDevices() {
  console.log('Getting devices...');
  if (!searchingForDevices) {
    searchingForDevices = true;
    chromecastDevices.length = 0;
    bonjourClient.client.find({ type: 'googlecast' }, (service) => {
      // console.log(`Found Bonjour Service: ${JSON.stringify(service, null, 4)}`);
      console.log(`Found Bonjour Service: ${service.txt.fn}`);
      if (service.txt.md.toLowerCase().includes("hub".toLowerCase())) {
        const device = {
          address: service.addresses[0],
          txt: service.txt,
          name: service.name,
          port: service.port,
        };
        chromecastDevices.push(device);
      }
    });
    setTimeout(notifyDevicesFetched, 5000);
  }
}

function notifyDevicesFetched() {
  if (mainWindow) {
    console.log(`Notifying of ${chromecastDevices.length} devices fetched.`);
    mainWindow.webContents.send(channels.FETCHED_DEVICES, chromecastDevices);
  }
  else {
    console.warn('App not ready to receive messages.');
    mainWindow.webContents.send(channels.NOOP, 'noop');
  }
  searchingForDevices = false;
}

function selectedDevice(event, chromecastDeviceId) {
  if (chromecastDeviceId) {
    try {
      selectedChromecastDevice = chromecastDevices.find(chromecastDevice => chromecastDevice.txt.id === chromecastDeviceId);
      console.log(`User selected device: ${selectedChromecastDevice.txt.fn}`);
    }
    catch (err) {
      console.error(JSON.stringify(err));
    }
  }
}

async function startChromecast(event, arg) {
  if (arg !== '') {
    // TODO: Stop current cast if already casting
    console.log(`Starting a Chromecast on target device ${selectedChromecastDevice.txt.fn} at ${selectedChromecastDevice.address}...`);
    chromecastClient = await connect({host: selectedChromecastDevice.address});
    // const platform = await createPlatform(chromecastClient);
    // const status = await platform.getStatus();
    // console.log(`Current Chromecast status: ${JSON.stringify(status, null, 4)}`);
    receiver = ReceiverController.createReceiver({ client: chromecastClient, sourceId: 'nest-castdeck' });
    receiver.getStatus().then((status) => {
      // console.log(`Current Chromecast status: ${JSON.stringify(status, null, 4)}`);
      console.log(`Current Chromecast status isOk: ${status.value.isOk}`);
    });
  }
}

async function stopChromecast(event, arg) {
  if (arg !== '') {
    console.log(`Stopping a Chromecast on target device ${selectedChromecastDevice.txt.fn} at ${selectedChromecastDevice.address}...`);
    receiver.dispose();
    chromecastClient.close();
  }
}
