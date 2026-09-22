import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { Editor } from './components/Editor';
import { PaperPreview } from './components/PaperPreview';
import { StyleToolbar } from './components/StyleToolbar';
import { TemplatesModal } from './components/TemplatesModal';
import { ExportModal } from './components/ExportModal';
import { ImportModal } from './components/ImportModal';
import { HandwritingSettings, SampleTemplate, InsertionConfig } from './types';
import { splitMarkdownIntoPages } from './utils/markdownParser';

const DEFAULT_SETTINGS: HandwritingSettings = {
  font: 'Caveat',
  fontSize: 20,
  lineHeight: 32,
  letterSpacing: 0.5,
  wordSpacing: 1.5,
  inkColor: '#1e3a8a',
  paperType: 'ruled',
  paperColor: '#fdfbf7',
  pageSize: 'A4',
  orientation: 'portrait',
  penThickness: 'regular',
  jitter: 'subtle',
  slant: -0.5,
  baselineOffset: 0,
  showMarginLine: true,
  marginLineWidth: 70,
  showHoles: true,
  showHeader: false,
  headerDate: '',
  headerSubject: '',
  showPageNumbers: true,
  pageNumberStyle: 'x-of-y',
};

const DEFAULT_MARKDOWN = `# Computer Networks Lab Report
## Experiment 1: Packet Sniffing & Analysis

In this experiment, we utilized **Wireshark** to capture and analyze live network packets traversing the local network interface.

### Key Objectives:
- Capture and inspect TCP 3-way handshake (SYN, SYN-ACK, ACK)
- Examine DNS query and response resolution delays
- Verify payload integrity and checksum validation

> **Observation:** Packet delivery latency stayed consistently under 12ms during localized echo requests.

### Captured Protocol Summary:
| Protocol | Packet Count | Percentage |
| :--- | :--- | :--- |
| TCP | 1,420 | 68.4% |
| UDP | 450 | 21.7% |
| ICMP | 110 | 5.3% |
| Other | 95 | 4.6% |

- [x] Initial interface promiscuous mode enabled
- [x] Captured baseline ICMP echo traffic
- [ ] Document final throughput benchmarks

==Note: Ensure all MAC addresses are anonymized before submitting the final laboratory report.==
`;

export const App: React.FC = () => {
  const [markdown, setMarkdown] = useState<string>(DEFAULT_MARKDOWN);
  const [settings, setSettings] = useState<HandwritingSettings>(DEFAULT_SETTINGS);
  const [currentFileName, setCurrentFileName] = useState<string>('notes.md');
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'split' | 'preview' | 'editor'>('split');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  
  // Import modal state
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [droppedImportFile, setDroppedImportFile] = useState<File | null>(null);
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);

  // Compute pages based on settings and manual pagebreaks
  const pages = useMemo(() => {
    // Check for explicit manual pagebreaks first
    const explicitBreakRegex = /(?:<!--\s*pagebreak\s*-->|===page===|\\pagebreak|---page---)/gi;
    if (explicitBreakRegex.test(markdown)) {
      return markdown.split(explicitBreakRegex).map((p) => p.trim()).filter(Boolean);
    }

    // Otherwise split logically based on line height and paper height
    const maxLines = Math.max(18, Math.floor(860 / (settings.lineHeight || 32)));
    return splitMarkdownIntoPages(markdown, maxLines);
  }, [markdown, settings.lineHeight]);

  // Handle open file
  const handleOpenFile = async () => {
    if (!window.electronAPI) return;
    const file = await window.electronAPI.openFile();
    if (file) {
      setMarkdown(file.content);
      setCurrentFileName(file.name);
      setCurrentFilePath(file.path);
    }
  };

  // Handle save file
  const handleSaveFile = async () => {
    if (!window.electronAPI) return;
    const savedPath = await window.electronAPI.saveFile(markdown, currentFilePath || undefined);
    if (savedPath) {
      setCurrentFilePath(savedPath);
      const name = savedPath.split('/').pop() || savedPath.split('\\').pop() || 'notes.md';
      setCurrentFileName(name);
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

  // Delete page from current content
  const handleDeletePage = (pageIndexToDelete: number) => {
    setMarkdown((prev) => {
      const explicitBreakRegex = /(?:<!--\s*pagebreak\s*-->|===page===|\\pagebreak|---page---)/gi;
      let existingPages = prev.split(explicitBreakRegex).map((s) => s.trim()).filter(Boolean);

      // If no explicit breaks exist yet and document is long, partition using splitMarkdownIntoPages
      if (existingPages.length <= 1) {
        const maxLines = Math.max(18, Math.floor(860 / (settings.lineHeight || 32)));
        const autoPages = splitMarkdownIntoPages(prev, maxLines).filter(Boolean);
        if (autoPages.length > 1) {
          existingPages = autoPages;
        }
      }

      if (existingPages.length <= 1) {
        return '';
      }

      if (pageIndexToDelete >= 0 && pageIndexToDelete < existingPages.length) {
        existingPages.splice(pageIndexToDelete, 1);
        return existingPages.join('\n\n<!-- pagebreak -->\n\n');
      }

      return prev;
    });
  };

  // Header quick page deletion trigger
  const handleDeletePageHeaderClick = () => {
    if (pages.length <= 1) {
      if (window.confirm('Delete the current page and clear its content?')) {
        handleDeletePage(0);
      }
      return;
    }

    const input = window.prompt(`Enter page number to delete (1 to ${pages.length}):`, '1');
    if (!input) return;
    const pageNum = parseInt(input, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= pages.length) {
      if (window.confirm(`Delete Page ${pageNum} from your content?`)) {
        handleDeletePage(pageNum - 1);
      }
    } else {
      alert(`Please enter a valid page number between 1 and ${pages.length}.`);
    }
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
        onDeletePageClick={handleDeletePageHeaderClick}
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
            onDeletePage={handleDeletePage}
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

      {/* Insert Pages from PDF, Word / Google Docs Modal */}
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
