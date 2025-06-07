const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  sendGameCommand: (command) => ipcRenderer.invoke('game:sendCommand', command),
  toggleFullscreen: () => ipcRenderer.invoke('app:toggleFullscreen'),
  
  // Add listeners for backend communication
  onBackendMessage: (callback) => {
    ipcRenderer.on('backend-message', callback);
  },
  
  removeBackendListener: () => {
    ipcRenderer.removeAllListeners('backend-message');
  }
});