import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: 'ScribeCraft — Markdown to Handwritten Notes Converter',
    backgroundColor: '#18181b',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: true,
    },
    titleBarStyle: 'default',
    show: false,
  });

  // Load index.html or dev server
  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Ensure single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ============================================================================
// IPC Handlers
// ============================================================================

// IPC Handler: Open Markdown File
ipcMain.handle('dialog:openFile', async () => {
  if (!mainWindow) return null;

  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Open Markdown File',
    properties: ['openFile'],
    filters: [
      { name: 'Markdown Files', extensions: ['md', 'markdown', 'mdown', 'mkdn', 'txt'] },
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
    return { content, path: filePath, filename };
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

// IPC Handler: Export to PDF (Supports multi-page export)
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
      preferCSSPageSize: false,
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
