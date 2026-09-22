import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (content: string, defaultPath?: string) =>
    ipcRenderer.invoke('dialog:saveFile', { content, defaultPath }),
  exportPdf: (options: { pageSize: string; landscape: boolean; printBackground: boolean }) =>
    ipcRenderer.invoke('export:pdf', options),
  importDocument: () =>
    ipcRenderer.invoke('dialog:importDocument'),
  parseDocumentBuffer: (buffer: Uint8Array, filename: string) =>
    ipcRenderer.invoke('file:parseDocumentBuffer', { buffer, filename }),
  showItemInFolder: (filePath: string) =>
    ipcRenderer.invoke('shell:showItemInFolder', filePath),
  platform: process.platform,
});
