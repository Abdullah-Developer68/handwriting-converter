import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { Editor } from './components/Editor';
import { PaperPreview } from './components/PaperPreview';
import { StyleToolbar } from './components/StyleToolbar';
import { TemplatesModal } from './components/TemplatesModal';
import { ExportModal } from './components/ExportModal';
import { ImportModal } from './components/ImportModal';
import { HandwritingSettings, SampleTemplate, InsertionConfig } from './types';
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

  const [viewMode, setViewMode] = useState<'split' | 'editor' | 'preview'>('split');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => window.innerWidth > 960);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [droppedImportFile, setDroppedImportFile] = useState<File | null>(null);
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);

  // Sync markdown to localStorage
  useEffect(() => {
    localStorage.setItem('scribecraft_markdown', markdown);
  }, [markdown]);

  // Sync settings to localStorage
  useEffect(() => {
    localStorage.setItem('scribecraft_settings', JSON.stringify(settings));
  }, [settings]);

  // Derive pages based on explicit page breaks and line capacity
  const pages = useMemo(() => {
    const maxLines = Math.max(18, Math.floor(860 / (settings.lineHeight || 32)));
    return splitMarkdownIntoPages(markdown, maxLines);
  }, [markdown, settings.lineHeight]);

  // File Open Handler
  const handleOpenFile = async () => {
    if (window.electronAPI) {
      try {
        const fileData = await window.electronAPI.openFile();
        if (fileData) {
          setMarkdown(fileData.content);
          setCurrentFileName(fileData.filename);
          setCurrentFilePath(fileData.path);
        }
      } catch (err) {
        console.error('Failed to open file:', err);
      }
    } else {
      // Browser fallback file picker
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.md,.markdown,.txt';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (re) => {
            const content = re.target?.result as string;
            setMarkdown(content || '');
            setCurrentFileName(file.name);
            setCurrentFilePath(null);
          };
          reader.readAsText(file);
        }
      };
      input.click();
    }
  };

  // File Save Handler
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
  const handleInsertContent = (
    pagesToInsert: { text: string; imageUrl?: string }[],
    config: InsertionConfig
  ) => {
    // Determine markdown content per page depending on importFormat
    const formattedPages = pagesToInsert.map((p) => {
      if (config.importFormat === 'visual' && p.imageUrl) {
        return `<div class="visual-page-embed">\n<img src="${p.imageUrl}" alt="Document Page" />\n</div>`;
      }
      return p.text;
    });

    const contentToInsert = formattedPages.join('\n\n<!-- pagebreak -->\n\n');

    setMarkdown((prev) => {
      if (config.target === 'replace') {
        return contentToInsert;
      }

      // Option 1: At Start
      if (config.target === 'start' || config.target === 'prepend') {
        if (!prev.trim()) return contentToInsert;
        return `${contentToInsert}\n\n<!-- pagebreak -->\n\n${prev.trimStart()}`;
      }

      // Option 2: At End
      if (config.target === 'end' || config.target === 'append') {
        if (!prev.trim()) return contentToInsert;
        return `${prev.trimEnd()}\n\n<!-- pagebreak -->\n\n${contentToInsert}`;
      }

      // Option 3: At Specific Page Number (before or after)
      if (config.target === 'specific-page') {
        const explicitBreakRegex = /(?:<!--\s*pagebreak\s*-->|===page===|\\pagebreak|---page---)/gi;
        let existingPages = prev.split(explicitBreakRegex).map((s) => s.trim()).filter(Boolean);

        // If no manual pagebreak exists yet and document is long, partition using splitMarkdownIntoPages
        if (existingPages.length <= 1) {
          const maxLines = Math.max(18, Math.floor(860 / (settings.lineHeight || 32)));
          const autoPages = splitMarkdownIntoPages(prev, maxLines).filter(Boolean);
          if (autoPages.length > 1) {
            existingPages = autoPages;
          }
        }

        if (existingPages.length === 0) {
          return contentToInsert;
        }

        const targetPage = Math.max(1, Math.min(existingPages.length, config.pageNumber || 1));
        const insertIndex = config.position === 'after' ? targetPage : targetPage - 1;

        existingPages.splice(insertIndex, 0, contentToInsert);
        return existingPages.join('\n\n<!-- pagebreak -->\n\n');
      }

      // Option 4: At Cursor
      if (config.target === 'cursor') {
        if (cursorPosition !== null && cursorPosition >= 0 && cursorPosition <= prev.length) {
          const before = prev.slice(0, cursorPosition);
          const after = prev.slice(cursorPosition);
          return before + contentToInsert + after;
        }
        const sep = prev.trim() ? '\n\n<!-- pagebreak -->\n\n' : '';
        return prev + sep + contentToInsert;
      }

      // Default: append to end
      const sep = prev.trim() ? '\n\n<!-- pagebreak -->\n\n' : '';
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
        onViewModeChange={setViewMode}
        currentFileName={currentFileName}
        currentFilePath={currentFilePath}
        wordCount={markdown.trim() ? markdown.trim().split(/\s+/).length : 0}
        pageCount={pages.length}
      />

      {/* Main Workspace Area */}
      <div className="workspace-container">
        {/* Markdown Source Editor */}
        {viewMode !== 'preview' && (
          <Editor
            value={markdown}
            onChange={setMarkdown}
            onDropFile={handleDropFile}
            onOpenImport={() => {
              setDroppedImportFile(null);
              setIsImportOpen(true);
            }}
            onCursorChange={setCursorPosition}
          />
        )}

        {/* Live Handwritten Realistic Notebook Preview */}
        {viewMode !== 'editor' && (
          <PaperPreview
            pages={pages}
            settings={settings}
          />
        )}

        {/* Handwriting Realism & Stationery Settings Sidebar */}
        {isSidebarOpen && (
          <StyleToolbar
            settings={settings}
            onChange={setSettings}
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
        totalNotePages={pages.length}
      />
    </div>
  );
};
