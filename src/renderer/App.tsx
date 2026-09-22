import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { Editor } from './components/Editor';
import { PaperPreview } from './components/PaperPreview';
import { StyleToolbar } from './components/StyleToolbar';
import { TemplatesModal } from './components/TemplatesModal';
import { ExportModal } from './components/ExportModal';
import { ImportModal } from './components/ImportModal';
import { HandwritingSettings, SampleTemplate, InsertionTarget } from './types';
import { DEFAULT_SETTINGS } from './utils/paperStyles';
import { SAMPLE_TEMPLATES } from './utils/defaultTemplates';
import { splitMarkdownIntoPages } from './utils/markdownParser';

export const App: React.FC = () => {
  // Start with the first curated sample note
  const [markdown, setMarkdown] = useState<string>(() => {
    const saved = localStorage.getItem('scribecraft_markdown');
    return saved !== null ? saved : SAMPLE_TEMPLATES[0].markdown;
  });

  const [currentFileName, setCurrentFileName] = useState<string>('physics-notes.md');
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);

  const [settings, setSettings] = useState<HandwritingSettings>(() => {
    try {
      const saved = localStorage.getItem('scribecraft_settings');
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to parse saved settings', e);
    }
    return DEFAULT_SETTINGS;
  });

  const [viewMode, setViewMode] = useState<'split' | 'preview' | 'editor'>('split');
  const [zoom, setZoom] = useState<number>(100);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => window.innerWidth > 960);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [droppedImportFile, setDroppedImportFile] = useState<File | null>(null);
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('scribecraft_markdown', markdown);
  }, [markdown]);

  useEffect(() => {
    localStorage.setItem('scribecraft_settings', JSON.stringify(settings));
  }, [settings]);

  // Split markdown into pages (automatically paginates whenever content exceeds 1 sheet)
  const pages = useMemo(() => {
    const maxLines = Math.max(18, Math.floor(860 / (settings.lineHeight || 32)));
    return splitMarkdownIntoPages(markdown, maxLines);
  }, [markdown, settings.lineHeight]);

  // Word count
  const wordCount = useMemo(() => {
    const words = markdown.trim().split(/\s+/).filter(Boolean);
    return words.length;
  }, [markdown]);

  // Update settings handler
  const handleUpdateSettings = (updated: Partial<HandwritingSettings>) => {
    setSettings((prev) => ({ ...prev, ...updated }));
  };

  // Open file handler (Electron IPC or HTML File input fallback)
  const handleOpenFile = async () => {
    if (window.electronAPI) {
      try {
        const file = await window.electronAPI.openFile();
        if (file) {
          setMarkdown(file.content);
          setCurrentFileName(file.filename);
          setCurrentFilePath(file.path);
        }
      } catch (err) {
        console.error('Failed to open file via electron:', err);
      }
    } else {
      // Browser fallback
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.md,.markdown,.txt';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          handleDropFile(file);
        }
      };
      input.click();
    }
  };

  // Save file handler
  const handleSaveFile = async () => {
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.saveFile(markdown, currentFileName);
        if (result.success && result.path) {
          setCurrentFilePath(result.path);
          const name = result.path.split(/[\\/]/).pop() || currentFileName;
          setCurrentFileName(name);
        }
      } catch (err) {
        console.error('Failed to save file:', err);
      }
    } else {
      // Browser download fallback
      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = currentFileName;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  // File drag & drop onto editor / app
  const handleDropFile = (file: File) => {
    const lowerName = file.name.toLowerCase();
    // If dropped file is a PDF, DOCX, or DOC, open the Import Modal to select pages & insertion place!
    if (lowerName.endsWith('.pdf') || lowerName.endsWith('.docx') || lowerName.endsWith('.doc')) {
      setDroppedImportFile(file);
      setIsImportOpen(true);
      return;
    }

    // Otherwise load directly as markdown/txt
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content !== undefined) {
        setMarkdown(content);
        setCurrentFileName(file.name);
        setCurrentFilePath(null);
      }
    };
    reader.readAsText(file);
  };

  // Insert imported document content into chosen destination
  const handleInsertContent = (contentToInsert: string, target: InsertionTarget) => {
    setMarkdown((prev) => {
      if (target === 'replace') {
        return contentToInsert;
      }
      if (target === 'prepend') {
        return `${contentToInsert}\n\n<!-- pagebreak -->\n\n${prev}`.trim();
      }
      if (target === 'append') {
        const sep = prev.trim() ? '\n\n<!-- pagebreak -->\n\n' : '';
        return prev + sep + contentToInsert;
      }
      if (target === 'new-page') {
        if (cursorPosition !== null && cursorPosition >= 0 && cursorPosition <= prev.length) {
          const before = prev.slice(0, cursorPosition).trimEnd();
          const after = prev.slice(cursorPosition).trimStart();
          const beforeSep = before ? '\n\n<!-- pagebreak -->\n\n' : '';
          const afterSep = after ? '\n\n<!-- pagebreak -->\n\n' : '';
          return `${before}${beforeSep}${contentToInsert}${afterSep}${after}`;
        }
        const sep = prev.trim() ? '\n\n<!-- pagebreak -->\n\n' : '';
        return prev + sep + contentToInsert;
      }
      // target === 'cursor'
      if (cursorPosition !== null && cursorPosition >= 0 && cursorPosition <= prev.length) {
        const before = prev.slice(0, cursorPosition);
        const after = prev.slice(cursorPosition);
        return before + contentToInsert + after;
      }
      const sep = prev.trim() ? '\n\n' : '';
      return prev + sep + contentToInsert;
    });
  };

  // Select sample template
  const handleSelectTemplate = (template: SampleTemplate) => {
    setMarkdown(template.markdown);
    setSettings((prev) => ({
      ...prev,
      ...template.recommendedSettings,
    }));
    setCurrentFileName(`${template.id}.md`);
    setCurrentFilePath(null);
  };

  // Global Keyboard Shortcuts (Ctrl+S, Ctrl+O, Ctrl+E, Ctrl+I)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveFile();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        handleOpenFile();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        setIsExportOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        setDroppedImportFile(null);
        setIsImportOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [markdown, currentFileName]);

  return (
    <div className="app-layout">
      {/* Top Application Header */}
      <Header
        onOpenFile={handleOpenFile}
        onSaveFile={handleSaveFile}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onOpenImport={() => {
          setDroppedImportFile(null);
          setIsImportOpen(true);
        }}
        onExportPdf={() => setIsExportOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen((v) => !v)}
        isSidebarOpen={isSidebarOpen}
        viewMode={viewMode}
        setViewMode={setViewMode}
        pageCount={pages.length}
        wordCount={wordCount}
        currentFileName={currentFileName}
      />

      {/* Main Content Workspace */}
      <div className="workspace-container">
        {/* Editor Pane (Hidden in Preview-only mode) */}
        {viewMode !== 'preview' && (
          <Editor
            value={markdown}
            onChange={setMarkdown}
            onDropFile={handleDropFile}
            onCursorChange={setCursorPosition}
            onOpenImport={() => {
              setDroppedImportFile(null);
              setIsImportOpen(true);
            }}
          />
        )}

        {/* Paper Live Preview Pane (Hidden in Editor-only mode) */}
        {viewMode !== 'editor' && (
          <PaperPreview
            pages={pages}
            settings={settings}
            zoom={zoom}
            setZoom={setZoom}
          />
        )}

        {/* Handwriting Styles & Paper Configuration Toolbar */}
        {isSidebarOpen && (
          <StyleToolbar
            settings={settings}
            onChange={handleUpdateSettings}
            onClose={() => setIsSidebarOpen(false)}
          />
        )}
      </div>

      {/* Templates Modal */}
      <TemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* Export to PDF Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        settings={settings}
        pageCount={pages.length}
      />

      {/* Import Pages from PDF, Word / Google Docs Modal */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => {
          setIsImportOpen(false);
          setDroppedImportFile(null);
        }}
        onInsert={handleInsertContent}
        initialFile={droppedImportFile}
        hasCursorPosition={cursorPosition !== null}
      />
    </div>
  );
};
