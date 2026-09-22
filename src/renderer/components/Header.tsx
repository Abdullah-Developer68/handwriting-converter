import React from 'react';
import { 
  FileText, 
  FolderOpen, 
  Save, 
  Download, 
  BookOpen, 
  Columns, 
  Eye, 
  Edit3, 
  FileDown,
  Palette
} from 'lucide-react';

interface HeaderProps {
  onOpenFile: () => void;
  onSaveFile: () => void;
  onOpenTemplates: () => void;
  onOpenImport: () => void;
  onExportPdf: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  viewMode: 'split' | 'preview' | 'editor';
  setViewMode: (mode: 'split' | 'preview' | 'editor') => void;
  pageCount: number;
  wordCount: number;
  currentFileName: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenFile,
  onSaveFile,
  onOpenTemplates,
  onOpenImport,
  onExportPdf,
  onToggleSidebar,
  isSidebarOpen = true,
  viewMode,
  setViewMode,
  pageCount,
  wordCount,
  currentFileName,
}) => {
  return (
    <header className="app-header no-print">
      {/* Brand & File info */}
      <div className="header-left">
        <div className="brand-badge">
          <div className="brand-icon">
            <Edit3 size={18} />
          </div>
          <div>
            <h1 className="brand-title">
              ScribeCraft
            </h1>
            <div className="brand-subtitle">
              Markdown to Handwritten Notes
            </div>
          </div>
        </div>

        <div className="header-divider" />

        {/* Current File indicator */}
        <div className="header-file-badge" title={currentFileName}>
          <FileText size={13} color="#818cf8" style={{ flexShrink: 0 }} />
          <span className="file-name">
            {currentFileName}
          </span>
          <span className="file-metrics">
            ({wordCount}w • {pageCount}p)
          </span>
        </div>
      </div>

      {/* Center: View mode switcher */}
      <div className="view-mode-container">
        <button
          className={`btn btn-sm ${viewMode === 'editor' ? 'btn-secondary' : 'btn-ghost'}`}
          onClick={() => setViewMode('editor')}
          title="Editor only"
        >
          <Edit3 size={14} />
          <span className="view-mode-label">Editor</span>
        </button>
        <button
          className={`btn btn-sm ${viewMode === 'split' ? 'btn-secondary' : 'btn-ghost'}`}
          onClick={() => setViewMode('split')}
          title="Split view (Editor + Handwritten Preview)"
        >
          <Columns size={14} />
          <span className="view-mode-label">Split</span>
        </button>
        <button
          className={`btn btn-sm ${viewMode === 'preview' ? 'btn-secondary' : 'btn-ghost'}`}
          onClick={() => setViewMode('preview')}
          title="Preview only"
        >
          <Eye size={14} />
          <span className="view-mode-label">Paper</span>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="header-actions">
        {onToggleSidebar && (
          <button 
            className={`btn btn-sm ${isSidebarOpen ? 'btn-secondary active-sidebar-btn' : 'btn-ghost'}`}
            onClick={onToggleSidebar}
            title={isSidebarOpen ? "Hide Stationery & Style Sidebar" : "Show Stationery & Style Sidebar"}
          >
            <Palette size={14} color="#a855f7" />
            <span className="header-btn-label">Styles</span>
          </button>
        )}

        <button 
          className="btn btn-secondary btn-sm"
          onClick={onOpenTemplates}
          title="Browse Sample Templates"
        >
          <BookOpen size={14} color="#a855f7" />
          <span className="header-btn-label">Templates</span>
        </button>

        <button 
          className="btn btn-secondary btn-sm"
          onClick={onOpenImport}
          title="Import pages from PDF, Word, or Google Docs (.docx)"
        >
          <FileDown size={14} color="#38bdf8" />
          <span className="header-btn-label">Import</span>
        </button>

        <button 
          className="btn btn-secondary btn-sm"
          onClick={onOpenFile}
          title="Open Markdown File"
        >
          <FolderOpen size={14} />
          <span className="header-btn-label">Open</span>
        </button>

        <button 
          className="btn btn-secondary btn-sm"
          onClick={onSaveFile}
          title="Save Markdown File"
        >
          <Save size={14} />
          <span className="header-btn-label">Save</span>
        </button>

        <button 
          className="btn btn-primary btn-sm btn-export"
          onClick={onExportPdf}
          title="Export Handwritten Notes to PDF"
          style={{ fontWeight: 600 }}
        >
          <Download size={14} />
          <span className="header-btn-label">Export PDF</span>
        </button>
      </div>
    </header>
  );
};
