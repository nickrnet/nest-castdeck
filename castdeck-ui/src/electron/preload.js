// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { ipcRenderer } = require("electron");

const channels = require('./channels');

// As an example, here we use the exposeInMainWorld API to expose the browsers
// and node versions to the main window.
// They'll be accessible at "window.versions".
process.once("loaded", () => {
  contextBridge.exposeInMainWorld("versions", process.versions);
  contextBridge.exposeInMainWorld('electronAPI', {
    onUpdateCounter: (callback) => ipcRenderer.on(channels.GET_DEVICES, callback)
  });
});