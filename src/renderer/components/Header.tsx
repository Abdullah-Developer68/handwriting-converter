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
  Sparkles,
  Printer
} from 'lucide-react';

interface HeaderProps {
  onOpenFile: () => void;
  onSaveFile: () => void;
  onOpenTemplates: () => void;
  onExportPdf: () => void;
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
  onExportPdf,
  viewMode,
  setViewMode,
  pageCount,
  wordCount,
  currentFileName,
}) => {
  return (
    <header className="app-header no-print">
      {/* Brand & File info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)'
          }}>
            <Edit3 size={18} />
          </div>
          <div>
            <h1 style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.02em', color: '#f4f4f5' }}>
              ScribeCraft
            </h1>
            <div style={{ fontSize: '10px', color: '#a1a1aa', marginTop: '-2px' }}>
              Markdown to Handwritten Notes
            </div>
          </div>
        </div>

        <div style={{ height: '20px', width: '1px', backgroundColor: '#27272a', margin: '0 4px' }} />

        {/* Current File indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '6px',
          backgroundColor: '#202024',
          fontSize: '12px',
          color: '#d4d4d8'
        }}>
          <FileText size={13} color="#818cf8" />
          <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentFileName}
          </span>
          <span style={{ color: '#71717a', fontSize: '11px' }}>
            ({wordCount} words • {pageCount} {pageCount === 1 ? 'page' : 'pages'})
          </span>
        </div>
      </div>

      {/* Center: View mode switcher */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#202024',
        padding: '3px',
        borderRadius: '8px',
        border: '1px solid #27272a'
      }}>
        <button
          className={`btn btn-sm ${viewMode === 'editor' ? 'btn-secondary' : 'btn-ghost'}`}
          onClick={() => setViewMode('editor')}
          title="Editor only"
          style={{ padding: '4px 8px' }}
        >
          <Edit3 size={14} />
          <span>Editor</span>
        </button>
        <button
          className={`btn btn-sm ${viewMode === 'split' ? 'btn-secondary' : 'btn-ghost'}`}
          onClick={() => setViewMode('split')}
          title="Split view (Editor + Handwritten Preview)"
          style={{ padding: '4px 8px' }}
        >
          <Columns size={14} />
          <span>Split</span>
        </button>
        <button
          className={`btn btn-sm ${viewMode === 'preview' ? 'btn-secondary' : 'btn-ghost'}`}
          onClick={() => setViewMode('preview')}
          title="Preview only"
          style={{ padding: '4px 8px' }}
        >
          <Eye size={14} />
          <span>Paper</span>
        </button>
      </div>

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button 
          className="btn btn-secondary btn-sm"
          onClick={onOpenTemplates}
          title="Browse Sample Templates"
        >
          <BookOpen size={14} color="#a855f7" />
          <span>Templates</span>
        </button>

        <button 
          className="btn btn-secondary btn-sm"
          onClick={onOpenFile}
          title="Open Markdown File"
        >
          <FolderOpen size={14} />
          <span>Open</span>
        </button>

        <button 
          className="btn btn-secondary btn-sm"
          onClick={onSaveFile}
          title="Save Markdown File"
        >
          <Save size={14} />
          <span>Save</span>
        </button>

        <button 
          className="btn btn-primary btn-sm"
          onClick={onExportPdf}
          title="Export Handwritten Notes to PDF"
          style={{ fontWeight: 600 }}
        >
          <Download size={14} />
          <span>Export PDF</span>
        </button>
      </div>
    </header>
  );
};
