// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { contextBridge, ipcRenderer } = require("electron");

const { channels } = require('./channels');

// As an example, here we use the exposeInMainWorld API to expose the browsers
// and node versions to the main window.
// The following exposes the "nestcastdeck" object and its methods to the main window.
contextBridge.exposeInMainWorld(
  "api", {
    deregisterFetchedDevices: () => ipcRenderer.removeAllListeners(channels.FETCHED_DEVICES),
    deregisterNoOp: () => ipcRenderer.removeAllListeners(channels.NOOP),
    fetchDevices: () => ipcRenderer.invoke(channels.FETCH_DEVICES),
    selectedDevice: (chromecastDevice) => ipcRenderer.invoke(channels.SELECTED_DEVICE, chromecastDevice),
    startChromecast: () => ipcRenderer.invoke(channels.START_CHROMECAST),
    stopChromecast: () => ipcRenderer.invoke(channels.STOP_CHROMECAST),
    onFetchedDevices: (callback) => ipcRenderer.on(channels.FETCHED_DEVICES, callback),
    onNoop: (callback) => ipcRenderer.on(channels.NOOP, callback),
  }
);
