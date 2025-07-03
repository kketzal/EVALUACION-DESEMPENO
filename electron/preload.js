const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  exportSQLite: () => ipcRenderer.invoke('export-sqlite'),
  importSQLite: (filePath) => ipcRenderer.invoke('import-sqlite', filePath)
}); 