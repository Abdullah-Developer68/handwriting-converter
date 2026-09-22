import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';

let mainWindow: BrowserWindow | null = null;
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1380,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: 'ScribeCraft - Markdown to Handwritten Notes',
    backgroundColor: '#1c1917',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handler: Open File
ipcMain.handle('dialog:openFile', async () => {
  if (!mainWindow) return null;

  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Open Markdown File',
    properties: ['openFile'],
    filters: [
      { name: 'Markdown & Text Files', extensions: ['md', 'markdown', 'txt', 'rmd'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const filePath = result.filePaths[0];
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const filename = path.basename(filePath);
    return { content, filename, path: filePath };
  } catch (error) {
    console.error('Failed to read file:', error);
    throw error;
  }
});

// IPC Handler: Save Markdown File
ipcMain.handle('dialog:saveFile', async (_, { content, defaultPath }: { content: string; defaultPath?: string }) => {
  if (!mainWindow) return { success: false };

  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Markdown File',
    defaultPath: defaultPath || 'handwritten-notes.md',
    filters: [
      { name: 'Markdown Files', extensions: ['md'] },
      { name: 'Text Files', extensions: ['txt'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (result.canceled || !result.filePath) {
    return { success: false };
  }

  try {
    await fs.writeFile(result.filePath, content, 'utf-8');
    return { success: true, path: result.filePath };
  } catch (error) {
    console.error('Failed to save file:', error);
    throw error;
  }
});

// IPC Handler: Export to PDF
ipcMain.handle('export:pdf', async (_, options: { pageSize: string; landscape: boolean; printBackground: boolean }) => {
  if (!mainWindow) return { success: false, error: 'Window not found' };

  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Export Notes as PDF',
    defaultPath: 'handwritten-notes.pdf',
    filters: [{ name: 'PDF Documents', extensions: ['pdf'] }],
  });

  if (result.canceled || !result.filePath) {
    return { success: false };
  }

  try {
    // Generate high quality vector PDF with background graphics
    const pdfData = await mainWindow.webContents.printToPDF({
      printBackground: true,
      landscape: Boolean(options.landscape),
      pageSize: (options.pageSize as 'A4' | 'Letter') || 'A4',
      margins: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      },
      preferCSSPageSize: true,
    });

    await fs.writeFile(result.filePath, pdfData);
    return { success: true, path: result.filePath };
  } catch (error: any) {
    console.error('Failed to export PDF:', error);
    return { success: false, error: error.message || 'Error generating PDF' };
  }
});

// IPC Handler: Show Item In Folder
ipcMain.handle('shell:showItemInFolder', async (_, filePath: string) => {
  if (filePath) {
    shell.showItemInFolder(filePath);
  }
});
