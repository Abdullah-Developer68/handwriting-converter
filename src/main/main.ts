import * as electron from 'electron';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';

// Handle cases where Electron is launched with ELECTRON_RUN_AS_NODE (e.g., from certain IDE terminals)
if (typeof electron === 'string' || !(electron as any).app) {
  const electronBinary = typeof electron === 'string' ? electron : require('electron');
  const cleanEnv = { ...process.env };
  delete cleanEnv.ELECTRON_RUN_AS_NODE;

  const child = spawn(electronBinary, [path.resolve(__dirname, 'main.js'), ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: cleanEnv,
  });

  child.on('close', (code) => {
    process.exit(code ?? 0);
  });
} else {
  runElectronApp();
}

async function parseDocumentData(buffer: Buffer, filename: string): Promise<any> {
  const ext = path.extname(filename).toLowerCase();

  if (ext === '.pdf') {
    try {
      const { PDFParse } = require('pdf-parse');
      const parser = new PDFParse({ data: buffer });
      
      // 1. Extract text and page numbers
      const textResult = await parser.getText();

      // 2. Extract visual page screenshots sequentially
      let screenshotResult: any = null;
      try {
        screenshotResult = await parser.getScreenshot();
      } catch (sErr) {
        console.warn('Screenshot extraction failed, using text-only fallback:', sErr);
      }

      const screenshotMap = new Map<number, string>();
      if (screenshotResult && screenshotResult.pages) {
        screenshotResult.pages.forEach((p: any) => {
          if (p.dataUrl) {
            // p.pageNumber is 1-indexed
            screenshotMap.set(p.pageNumber, p.dataUrl);
          }
        });
      }

      const pages = (textResult.pages || []).map((p: any) => {
        const text = (p.text || '').trim();
        const imageUrl = screenshotMap.get(p.num);
        return {
          pageNumber: p.num,
          text,
          preview: text.replace(/\s+/g, ' ').substring(0, 140),
          imageUrl,
        };
      });

      await parser.destroy();
      return {
        type: 'pdf',
        filename,
        totalPages: pages.length,
        pages,
        fullContent: pages.map((p: any) => p.text).join('\n\n<!-- pagebreak -->\n\n'),
      };
    } catch (err: any) {
      console.error('Failed to parse PDF:', err);
      throw new Error(`Failed to parse PDF: ${err.message || err}`);
    }
  }

  if (ext === '.docx' || ext === '.doc') {
    try {
      const mammoth = require('mammoth');
      const options = {
        ignoreEmptyParagraphs: true,
        convertImage: mammoth.images.imgElement((image: any) => {
          return image.read('base64').then((imageBuffer: string) => {
            return {
              src: `data:${image.contentType};base64,${imageBuffer}`,
            };
          });
        }),
      };
      const result = await mammoth.convertToMarkdown({ buffer }, options);
      const markdown = (result.value || '').trim();

      // Split into sections or discrete pages
      const explicitBreakRegex = /(?:<!--\s*pagebreak\s*-->|===page===|\\pagebreak|---page---)/gi;
      let rawPages = markdown.split(explicitBreakRegex).map((s: string) => s.trim()).filter(Boolean);

      // If only 1 section and long, split by headings (H1 or H2)
      if (rawPages.length <= 1 && markdown.length > 2000) {
        const headerParts = markdown.split(/(?=^#{1,2}\\s)/m).map((s: string) => s.trim()).filter(Boolean);
        if (headerParts.length > 1) {
          rawPages = headerParts;
        }
      }

      if (rawPages.length === 0) {
        rawPages = [markdown];
      }

      const pages = rawPages.map((text: string, idx: number) => ({
        pageNumber: idx + 1,
        text,
        preview: text.replace(/\s+/g, ' ').substring(0, 140),
      }));

      return {
        type: 'docx',
        filename,
        totalPages: pages.length,
        pages,
        fullContent: markdown,
      };
    } catch (err: any) {
      console.error('Failed to parse DOCX:', err);
      throw new Error(`Failed to parse DOCX document: ${err.message || err}`);
    }
  }

  // Plain text or Markdown
  const text = buffer.toString('utf-8').trim();
  const explicitBreakRegex = /(?:<!--\s*pagebreak\s*-->|===page===|\\pagebreak|---page---)/gi;
  let rawPages = text.split(explicitBreakRegex).map((s: string) => s.trim()).filter(Boolean);
  if (rawPages.length === 0) rawPages = [text];

  const pages = rawPages.map((pageText: string, idx: number) => ({
    pageNumber: idx + 1,
    text: pageText,
    preview: pageText.replace(/\s+/g, ' ').substring(0, 140),
  }));

  return {
    type: ext === '.txt' ? 'text' : 'markdown',
    filename,
    totalPages: pages.length,
    pages,
    fullContent: text,
  };
}

function runElectronApp() {
  const { app, BrowserWindow, ipcMain, dialog, shell } = electron;

  let mainWindow: any = null;
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

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

    // Forward renderer console logs to main process terminal for easier debugging
    mainWindow.webContents.on('console-message', (_event: any, level: number, message: string, line: number, sourceId: string) => {
      console.log(`[Renderer log ${level}]: ${message} (${sourceId}:${line})`);
    });

    const devServerUrl = process.env.VITE_DEV_SERVER_URL;

    // Load index.html or dev server
    if (isDev && devServerUrl) {
      const loadDevServer = () => {
        mainWindow?.loadURL(devServerUrl).catch((err: any) => {
          console.warn(`Dev server not ready yet (${err.message}), retrying in 500ms...`);
          setTimeout(loadDevServer, 500);
        });
      };
      loadDevServer();
    } else {
      // Relative to dist/electron/main/main.js -> dist/renderer/index.html
      const htmlPath = path.join(__dirname, '../../renderer/index.html');
      mainWindow.loadFile(htmlPath).catch((err: any) => {
        console.error(`Failed to load file at ${htmlPath}:`, err);
      });
    }

    mainWindow.once('ready-to-show', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });

    // Fallback: If ready-to-show is not triggered within 2s, show window anyway
    setTimeout(() => {
      if (mainWindow && !mainWindow.isVisible()) {
        mainWindow.show();
        mainWindow.focus();
      }
    }, 2000);

    mainWindow.webContents.on('did-fail-load', (_: any, errorCode: number, errorDescription: string, validatedURL: string) => {
      console.error(`Failed to load URL: ${validatedURL}, Error: ${errorDescription} (${errorCode})`);
      if (mainWindow && !mainWindow.isVisible()) {
        mainWindow.show();
      }
    });

    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  }

  function startApp() {
    app.whenReady().then(() => {
      createWindow();

      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          createWindow();
        }
      });
    });
  }

  // In production, enforce single-instance lock. In development, allow instant restarts.
  if (app.isPackaged) {
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
      startApp();
    }
  } else {
    startApp();
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
  ipcMain.handle('dialog:saveFile', async (_: any, { content, defaultPath }: { content: string; defaultPath?: string }) => {
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
  ipcMain.handle('export:pdf', async (_: any, options: { pageSize: string; landscape: boolean; printBackground: boolean }) => {
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

  // IPC Handler: Import Document (PDF, Word / Google Docs, Markdown)
  ipcMain.handle('dialog:importDocument', async () => {
    if (!mainWindow) return null;

    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Import Pages from PDF or Word / Google Docs',
      properties: ['openFile'],
      filters: [
        {
          name: 'All Supported Documents (*.pdf, *.docx, *.doc, *.md, *.txt)',
          extensions: ['pdf', 'docx', 'doc', 'md', 'markdown', 'txt'],
        },
        { name: 'PDF Documents (*.pdf)', extensions: ['pdf'] },
        { name: 'Word / Google Docs (*.docx, *.doc)', extensions: ['docx', 'doc'] },
        { name: 'Markdown & Text (*.md, *.txt)', extensions: ['md', 'markdown', 'txt'] },
        { name: 'All Files (*.*)', extensions: ['*'] },
      ],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const filePath = result.filePaths[0];
    try {
      const buffer = await fs.readFile(filePath);
      const filename = path.basename(filePath);
      const parsed = await parseDocumentData(buffer, filename);
      parsed.path = filePath;
      return parsed;
    } catch (error: any) {
      console.error('Failed to import document:', error);
      throw error;
    }
  });

  // IPC Handler: Parse Document Buffer (e.g. from drag and drop)
  ipcMain.handle('file:parseDocumentBuffer', async (_: any, { buffer, filename }: { buffer: any; filename: string }) => {
    try {
      const nodeBuffer = Buffer.isBuffer(buffer)
        ? buffer
        : buffer instanceof Uint8Array
          ? Buffer.from(buffer.buffer, buffer.byteOffset, buffer.byteLength)
          : Buffer.from(buffer);
      return await parseDocumentData(nodeBuffer, filename);
    } catch (error: any) {
      console.error('Failed to parse buffer:', error);
      throw error;
    }
  });

  // IPC Handler: Show Item In Folder
  ipcMain.handle('shell:showItemInFolder', async (_: any, fullPath: string) => {
    shell.showItemInFolder(fullPath);
  });

  // IPC Handler: Get System Platform
  ipcMain.handle('system:getPlatform', () => {
    return process.platform;
  });
}
