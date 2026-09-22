import React, { useState, useEffect } from 'react';
import { HandwritingSettings, PdfExportOptions } from '../types';
import { Download, Printer, X, CheckCircle, AlertCircle, FolderOpen, Loader2 } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: HandwritingSettings;
  pageCount: number;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  settings,
  pageCount,
}) => {
  const [pageSize, setPageSize] = useState<'A4' | 'Letter'>(settings.pageSize === 'Letter' ? 'Letter' : 'A4');
  const [landscape, setLandscape] = useState(settings.orientation === 'landscape');
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{ success: boolean; path?: string; error?: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPageSize(settings.pageSize === 'Letter' ? 'Letter' : 'A4');
      setLandscape(settings.orientation === 'landscape');
      setExportResult(null);
      setIsExporting(false);
    }
  }, [isOpen, settings.pageSize, settings.orientation]);

  if (!isOpen) return null;

  const handleExportPdf = async () => {
    setIsExporting(true);
    setExportResult(null);

    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.exportPdf({
          pageSize,
          landscape,
          printBackground: true,
        });

        if (result.success) {
          setExportResult({ success: true, path: result.path });
        } else if (result.error) {
          setExportResult({ success: false, error: result.error });
        }
      } else {
        // Fallback for browser preview testing
        window.print();
        setExportResult({ success: true, path: 'Printed via system print dialog' });
      }
    } catch (err: any) {
      setExportResult({ success: false, error: err.message || 'Export failed' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSystemPrint = () => {
    window.print();
  };

  const handleOpenFolder = () => {
    if (exportResult?.path && window.electronAPI) {
      window.electronAPI.showItemInFolder(exportResult.path);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={18} color="#6366f1" />
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#f4f4f5' }}>
              Export Handwritten Notes to PDF
            </h2>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{
            backgroundColor: '#121214',
            border: '1px solid #27272a',
            borderRadius: '8px',
            padding: '14px',
            marginBottom: '18px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
              <span style={{ color: '#a1a1aa' }}>Document summary:</span>
              <span style={{ fontWeight: 600, color: '#f4f4f5' }}>{pageCount} {pageCount === 1 ? 'Sheet' : 'Sheets'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
              <span style={{ color: '#a1a1aa' }}>Handwriting Style:</span>
              <span style={{ color: '#818cf8', fontWeight: 500 }}>{settings.font}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: '#a1a1aa' }}>Paper Background:</span>
              <span style={{ textTransform: 'capitalize', color: '#f4f4f5' }}>{settings.paperType}</span>
            </div>
          </div>

          {/* PDF Page Format Settings */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', marginBottom: '6px' }}>
                Page Size
              </label>
              <select
                className="input-field"
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value as 'A4' | 'Letter')}
              >
                <option value="A4">A4 (Standard 210 x 297 mm)</option>
                <option value="Letter">US Letter (8.5 x 11 in)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', marginBottom: '6px' }}>
                Orientation
              </label>
              <select
                className="input-field"
                value={landscape ? 'landscape' : 'portrait'}
                onChange={(e) => setLandscape(e.target.value === 'landscape')}
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
          </div>

          {/* Success or Error Feedback */}
          {exportResult && (
            <div
              style={{
                marginTop: '12px',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: exportResult.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${exportResult.success ? '#22c55e' : '#ef4444'}`,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
              }}
            >
              {exportResult.success ? (
                <CheckCircle size={18} color="#22c55e" style={{ flexShrink: 0, marginTop: '2px' }} />
              ) : (
                <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
              )}
              <div style={{ flex: 1, fontSize: '13px' }}>
                <div style={{ fontWeight: 600, color: exportResult.success ? '#86efac' : '#fca5a5' }}>
                  {exportResult.success ? 'PDF Exported Successfully!' : 'Export Failed'}
                </div>
                {exportResult.path && (
                  <div style={{ fontSize: '11px', color: '#a1a1aa', wordBreak: 'break-all', marginTop: '4px' }}>
                    Saved to: {exportResult.path}
                  </div>
                )}
                {exportResult.error && (
                  <div style={{ fontSize: '11px', color: '#fca5a5', marginTop: '4px' }}>
                    {exportResult.error}
                  </div>
                )}

                {exportResult.path && window.electronAPI && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={handleOpenFolder}
                    style={{ marginTop: '8px', fontSize: '11px' }}
                  >
                    <FolderOpen size={12} />
                    <span>Open in Folder</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleSystemPrint}
            title="Open system print dialog"
          >
            <Printer size={14} />
            <span>Print Dialog</span>
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary btn-sm" onClick={onClose} disabled={isExporting}>
              Cancel
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleExportPdf}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download size={14} />
                  <span>Save PDF File</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
