import React, { useState, useEffect, useMemo } from 'react';
import { ParsedDocument, InsertionConfig, InsertionTarget } from '../types';
import { 
  FileUp, 
  FileDown, 
  CheckSquare, 
  Square, 
  Search, 
  X, 
  Loader2, 
  AlertCircle,
  Check,
  Image as ImageIcon,
  Type,
  ArrowUpToLine,
  ArrowDownToLine,
  Layers,
  RotateCcw,
  Trash2
} from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (pages: { text: string; imageUrl?: string }[], config: InsertionConfig) => void;
  initialFile?: File | null;
  hasCursorPosition: boolean;
  totalNotePages: number;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onInsert,
  initialFile,
  hasCursorPosition,
  totalNotePages,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [documentData, setDocumentData] = useState<ParsedDocument | null>(null);
  const [selectedPageNumbers, setSelectedPageNumbers] = useState<number[]>([]);
  const [activePreviewPageNum, setActivePreviewPageNum] = useState<number | null>(null);
  const [previewMode, setPreviewMode] = useState<'visual' | 'text'>('visual');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Insertion Destination Options (At the end of the dialog)
  const [insertionTarget, setInsertionTarget] = useState<InsertionTarget>('start');
  const [targetPageNumber, setTargetPageNumber] = useState<number>(1);
  const [pagePosition, setPagePosition] = useState<'before' | 'after'>('after');
  const [importFormat, setImportFormat] = useState<'visual' | 'handwritten'>('visual');

  // Load initial file if provided via drag-and-drop
  useEffect(() => {
    if (isOpen && initialFile) {
      handleProcessFile(initialFile);
    }
  }, [isOpen, initialFile]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setDocumentData(null);
      setSelectedPageNumbers([]);
      setActivePreviewPageNum(null);
      setErrorMessage(null);
      setSearchQuery('');
      setIsLoading(false);
      setPreviewMode('visual');
      setInsertionTarget('start');
      setTargetPageNumber(1);
      setPagePosition('after');
      setImportFormat('visual');
    }
  }, [isOpen]);

  // Parse File object
  const handleProcessFile = async (file: File) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (window.electronAPI?.parseDocumentBuffer) {
        const arrayBuffer = await file.arrayBuffer();
        const parsed = await window.electronAPI.parseDocumentBuffer(new Uint8Array(arrayBuffer), file.name);
        setDocumentData(parsed);
        const allNums = parsed.pages.map((p) => p.pageNumber);
        setSelectedPageNumbers(allNums);
        setActivePreviewPageNum(allNums[0] || null);
        if (parsed.pages[0]?.imageUrl) {
          setPreviewMode('visual');
          setImportFormat('visual');
        } else {
          setPreviewMode('text');
          setImportFormat('handwritten');
        }
      } else {
        // Web Fallback for text/md
        const text = await file.text();
        const parsed: ParsedDocument = {
          type: 'text',
          filename: file.name,
          totalPages: 1,
          pages: [{ pageNumber: 1, text, preview: text.slice(0, 100) }],
          fullContent: text,
        };
        setDocumentData(parsed);
        setSelectedPageNumbers([1]);
        setActivePreviewPageNum(1);
        setPreviewMode('text');
        setImportFormat('handwritten');
      }
    } catch (err: any) {
      console.error('Failed to parse file:', err);
      setErrorMessage(err.message || 'Failed to parse file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNativeOpenDialog = async () => {
    if (!window.electronAPI?.importDocument) {
      handlePickFile();
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const parsed = await window.electronAPI.importDocument();
      if (parsed) {
        setDocumentData(parsed);
        const allNums = parsed.pages.map((p) => p.pageNumber);
        setSelectedPageNumbers(allNums);
        setActivePreviewPageNum(allNums[0] || null);
        if (parsed.pages[0]?.imageUrl) {
          setPreviewMode('visual');
          setImportFormat('visual');
        } else {
          setPreviewMode('text');
          setImportFormat('handwritten');
        }
      }
    } catch (err: any) {
      console.error('Failed to open document dialog:', err);
      setErrorMessage(err.message || 'Failed to open document');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.docx,.doc,.txt,.md';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleProcessFile(file);
      }
    };
    input.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  // Toggle Selection
  const togglePageSelection = (pageNum: number) => {
    setSelectedPageNumbers((prev) => {
      if (prev.includes(pageNum)) {
        return prev.filter((p) => p !== pageNum);
      } else {
        return [...prev, pageNum].sort((a, b) => a - b);
      }
    });
  };

  const selectAllPages = () => {
    if (documentData) {
      setSelectedPageNumbers(documentData.pages.map((p) => p.pageNumber));
    }
  };

  const deselectAllPages = () => {
    setSelectedPageNumbers([]);
  };

  // Delete page directly from imported document before inserting
  const handleDeletePageFromImport = (pageNumberToDelete: number) => {
    if (!documentData) return;
    const updatedPages = documentData.pages.filter((p) => p.pageNumber !== pageNumberToDelete);
    setDocumentData({
      ...documentData,
      totalPages: updatedPages.length,
      pages: updatedPages,
    });
    setSelectedPageNumbers((prev) => prev.filter((n) => n !== pageNumberToDelete));
    if (activePreviewPageNum === pageNumberToDelete) {
      setActivePreviewPageNum(updatedPages[0]?.pageNumber || null);
    }
  };

  // Filtered pages based on search query
  const filteredPages = useMemo(() => {
    if (!documentData) return [];
    if (!searchQuery.trim()) return documentData.pages;

    const q = searchQuery.toLowerCase();
    return documentData.pages.filter((p) =>
      p.text.toLowerCase().includes(q) ||
      p.pageNumber.toString().includes(q) ||
      (p.preview && p.preview.toLowerCase().includes(q))
    );
  }, [documentData, searchQuery]);

  // Active page object being previewed
  const activePage = useMemo(() => {
    if (!documentData) return null;
    if (activePreviewPageNum === null) return documentData.pages[0] || null;
    return documentData.pages.find((p) => p.pageNumber === activePreviewPageNum) || null;
  }, [documentData, activePreviewPageNum]);

  // Submit and Insert
  const handleExecuteInsert = () => {
    if (!documentData || selectedPageNumbers.length === 0) return;

    // Filter pages in original order
    const pagesToInsert = documentData.pages
      .filter((p) => selectedPageNumbers.includes(p.pageNumber))
      .map((p) => ({
        text: p.text,
        imageUrl: p.imageUrl,
      }));

    onInsert(pagesToInsert, {
      target: insertionTarget,
      pageNumber: targetPageNumber,
      position: pagePosition,
      importFormat: importFormat,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}>
              <FileDown size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#f4f4f5', margin: 0 }}>
                Insert Pages from Document
              </h2>
              <div style={{ fontSize: '11px', color: '#a1a1aa' }}>
                Merge pages from PDF or DOCX into your notes. Inserted PDF pages keep their original styles.
              </div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Error Message */}
          {errorMessage && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '12px',
              flexShrink: 0,
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 20px',
              gap: '12px',
              color: '#a1a1aa',
            }}>
              <Loader2 size={32} className="animate-spin" color="#6366f1" />
              <div style={{ fontSize: '13px', fontWeight: 500 }}>Rendering document pages with high-fidelity...</div>
            </div>
          )}

          {/* State 1: No file loaded yet -> Upload / Dropzone */}
          {!isLoading && !documentData && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${isDragging ? '#6366f1' : '#3f3f46'}`,
                borderRadius: '12px',
                padding: '48px 24px',
                textAlign: 'center',
                backgroundColor: isDragging ? 'rgba(99, 102, 241, 0.08)' : '#18181b',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '14px',
                cursor: 'pointer',
              }}
              onClick={handleNativeOpenDialog}
            >
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                backgroundColor: '#27272a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818cf8',
              }}>
                <FileUp size={28} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#f4f4f5', margin: '0 0 4px 0' }}>
                  Choose PDF or Word Document
                </h3>
                <p style={{ fontSize: '13px', color: '#a1a1aa', margin: 0 }}>
                  Drag & drop your file here, or click to browse files
                </p>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '6px',
                fontSize: '11px',
                color: '#71717a',
              }}>
                <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: '#27272a' }}>PDF</span>
                <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: '#27272a' }}>DOCX</span>
                <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: '#27272a' }}>Google Docs</span>
                <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: '#27272a' }}>TXT / MD</span>
              </div>
            </div>
          )}

          {/* State 2: Document Loaded -> Preview & Insertion Flow */}
          {!isLoading && documentData && (
            <>
              {/* Active Document Header info */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: '#18181b',
                border: '1px solid #27272a',
                flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <div style={{
                    padding: '6px',
                    borderRadius: '6px',
                    backgroundColor: documentData.type === 'pdf' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                    color: documentData.type === 'pdf' ? '#ef4444' : '#3b82f6',
                    flexShrink: 0,
                  }}>
                    <FileDown size={18} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#f4f4f5',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {documentData.filename}
                    </div>
                    <div style={{ fontSize: '11px', color: '#a1a1aa' }}>
                      {documentData.totalPages} {documentData.totalPages === 1 ? 'page' : 'pages'} found • {selectedPageNumbers.length} selected for merge
                    </div>
                  </div>
                </div>

                <button className="btn btn-secondary btn-sm" onClick={handlePickFile} style={{ flexShrink: 0 }}>
                  <FileUp size={13} />
                  <span>Change File</span>
                </button>
              </div>

              {/* Pages & Preview Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#e4e4e7' }}>
                      Pages ({selectedPageNumbers.length}/{documentData.totalPages})
                    </span>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: '11px', padding: '2px 6px' }}
                      onClick={selectAllPages}
                    >
                      Select All
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: '11px', padding: '2px 6px' }}
                      onClick={deselectAllPages}
                    >
                      Deselect All
                    </button>
                  </div>

                  {/* Search Filter */}
                  {documentData.totalPages > 3 && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '3px 8px',
                      backgroundColor: '#18181b',
                      borderRadius: '6px',
                      border: '1px solid #27272a',
                    }}>
                      <Search size={12} color="#71717a" />
                      <input
                        type="text"
                        placeholder="Filter pages..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#f4f4f5',
                          fontSize: '11px',
                          outline: 'none',
                          width: '90px',
                        }}
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: 0 }}
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Two Column Layout: Page List (Left) & Preview Box (Right) */}
                <div className="import-modal-grid">
                  {/* Left Column: Page List Cards */}
                  <div style={{
                    overflowY: 'auto',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    backgroundColor: '#18181b',
                    padding: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    height: '100%',
                    minHeight: 0,
                    boxSizing: 'border-box',
                  }}>
                    {filteredPages.map((page) => {
                      const isSelected = selectedPageNumbers.includes(page.pageNumber);
                      const isPreviewing = activePreviewPageNum === page.pageNumber;

                      return (
                        <div
                          key={page.pageNumber}
                          onClick={() => setActivePreviewPageNum(page.pageNumber)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            backgroundColor: isPreviewing ? '#27272a' : isSelected ? '#202024' : 'transparent',
                            border: `1px solid ${isPreviewing ? '#6366f1' : isSelected ? '#3f3f46' : 'transparent'}`,
                            cursor: 'pointer',
                            transition: 'all 0.1s ease',
                          }}
                        >
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePageSelection(page.pageNumber);
                            }}
                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            {isSelected ? (
                              <CheckSquare size={16} color="#6366f1" />
                            ) : (
                              <Square size={16} color="#71717a" />
                            )}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '12px', fontWeight: 600, color: '#f4f4f5' }}>
                                Page {page.pageNumber}
                              </span>
                              {page.imageUrl && (
                                <span style={{ fontSize: '9px', padding: '1px 4px', borderRadius: '3px', backgroundColor: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}>
                                  PDF Page
                                </span>
                              )}
                            </div>
                            <div style={{
                              fontSize: '11px',
                              color: '#a1a1aa',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              {page.preview || '(Empty page)'}
                            </div>
                          </div>

                          {/* Option to Delete Page directly from imported PDF */}
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePageFromImport(page.pageNumber);
                            }}
                            style={{
                              padding: '3px 6px',
                              color: '#71717a',
                              height: '24px',
                              flexShrink: 0,
                              marginLeft: 'auto',
                            }}
                            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#f87171')}
                            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#71717a')}
                            title={`Delete Page ${page.pageNumber} from this PDF`}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      );
                    })}

                    {filteredPages.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '20px', color: '#71717a', fontSize: '12px' }}>
                        No pages in this document
                      </div>
                    )}
                  </div>

                  {/* Right Column: High-Fidelity Page Preview Box (Strictly Bounded) */}
                  <div style={{
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    backgroundColor: '#141416',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    minHeight: 0,
                    maxHeight: '100%',
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                  }}>
                    {/* Preview Header / Mode Switcher */}
                    <div style={{
                      padding: '5px 10px',
                      backgroundColor: '#1c1c20',
                      borderBottom: '1px solid #27272a',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#a1a1aa',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexShrink: 0,
                      height: '32px',
                      boxSizing: 'border-box',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>Page {activePreviewPageNum || 1} Preview</span>
                        {activePreviewPageNum && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleDeletePageFromImport(activePreviewPageNum)}
                            style={{ padding: '1px 5px', height: '20px', fontSize: '10px', color: '#f87171' }}
                            title={`Delete Page ${activePreviewPageNum} from import`}
                          >
                            <Trash2 size={11} style={{ marginRight: '3px' }} />
                            <span>Delete Page</span>
                          </button>
                        )}
                      </div>

                      {/* Visual vs Text Switcher */}
                      {activePage?.imageUrl && (
                        <div style={{ display: 'flex', backgroundColor: '#18181b', borderRadius: '4px', padding: '2px', border: '1px solid #27272a' }}>
                          <button
                            className={`btn btn-sm ${previewMode === 'visual' ? 'btn-secondary' : 'btn-ghost'}`}
                            onClick={() => setPreviewMode('visual')}
                            style={{ padding: '1px 6px', fontSize: '10px' }}
                            title="View original visual page layout"
                          >
                            <ImageIcon size={11} style={{ marginRight: '3px' }} />
                            Original Layout
                          </button>
                          <button
                            className={`btn btn-sm ${previewMode === 'text' ? 'btn-secondary' : 'btn-ghost'}`}
                            onClick={() => setPreviewMode('text')}
                            style={{ padding: '1px 6px', fontSize: '10px' }}
                            title="View extracted plain text content"
                          >
                            <Type size={11} style={{ marginRight: '3px' }} />
                            Text
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Preview Content Area */}
                    <div style={{
                      padding: '8px',
                      flex: 1,
                      minHeight: 0,
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: previewMode === 'visual' && activePage?.imageUrl ? '#232326' : '#141416',
                      position: 'relative',
                    }}>
                      {previewMode === 'visual' && activePage?.imageUrl ? (
                        <img
                          src={activePage.imageUrl}
                          alt={`Page ${activePreviewPageNum} preview`}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            height: '100%',
                            width: 'auto',
                            objectFit: 'contain',
                            borderRadius: '4px',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                            backgroundColor: '#ffffff',
                            display: 'block',
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          fontSize: '11px',
                          color: '#d4d4d8',
                          fontFamily: 'monospace',
                          lineHeight: '1.4',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          overflowY: 'auto',
                        }}>
                          {activePage?.text || 'Click any page to preview its content'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* OPTIONS AT THE END: Dedicated Clean Container */}
              <div className="import-options-section">
                {/* 1. Format Choice (Preserve Visual Page vs Handwritten) */}
                {activePage?.imageUrl && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    paddingBottom: '10px',
                    borderBottom: '1px solid #27272a',
                    flexWrap: 'wrap',
                  }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#f4f4f5' }}>
                        Page Styling:
                      </div>
                      <div style={{ fontSize: '11px', color: '#a1a1aa' }}>
                        {importFormat === 'visual'
                          ? "Original PDF styles and layout are preserved (notebook styles won't be applied)"
                          : "Convert text to handwritten notes on notebook paper"}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        className={`btn btn-sm ${importFormat === 'visual' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setImportFormat('visual')}
                        style={{ fontSize: '12px' }}
                      >
                        <ImageIcon size={13} />
                        <span>Preserve Original Styles & Layout</span>
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${importFormat === 'handwritten' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setImportFormat('handwritten')}
                        style={{ fontSize: '12px' }}
                      >
                        <Type size={13} />
                        <span>Transcribe to Handwriting</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. Where to Insert Content */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#e4e4e7', display: 'block', marginBottom: '8px' }}>
                    Where to Merge Pages:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}>
                    {/* Option 1: At Start */}
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        backgroundColor: insertionTarget === 'start' ? 'rgba(99, 102, 241, 0.12)' : '#18181b',
                        border: `1.5px solid ${insertionTarget === 'start' ? '#6366f1' : '#27272a'}`,
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="insertionTarget"
                        value="start"
                        checked={insertionTarget === 'start'}
                        onChange={() => setInsertionTarget('start')}
                        style={{ marginTop: '2px' }}
                      />
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#f4f4f5', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ArrowUpToLine size={13} color="#818cf8" />
                          <span>At Start</span>
                        </div>
                        <div style={{ fontSize: '10px', color: '#a1a1aa', marginTop: '2px' }}>
                          Beginning of document
                        </div>
                      </div>
                    </label>

                    {/* Option 2: At Specific Page Number */}
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        backgroundColor: insertionTarget === 'specific-page' ? 'rgba(99, 102, 241, 0.12)' : '#18181b',
                        border: `1.5px solid ${insertionTarget === 'specific-page' ? '#6366f1' : '#27272a'}`,
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="insertionTarget"
                        value="specific-page"
                        checked={insertionTarget === 'specific-page'}
                        onChange={() => setInsertionTarget('specific-page')}
                        style={{ marginTop: '2px' }}
                      />
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#f4f4f5', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Layers size={13} color="#a855f7" />
                          <span>At Page Number</span>
                        </div>
                        <div style={{ fontSize: '10px', color: '#a1a1aa', marginTop: '2px' }}>
                          Before or after Page #
                        </div>
                      </div>
                    </label>

                    {/* Option 3: At End */}
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        backgroundColor: insertionTarget === 'end' ? 'rgba(99, 102, 241, 0.12)' : '#18181b',
                        border: `1.5px solid ${insertionTarget === 'end' ? '#6366f1' : '#27272a'}`,
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="insertionTarget"
                        value="end"
                        checked={insertionTarget === 'end'}
                        onChange={() => setInsertionTarget('end')}
                        style={{ marginTop: '2px' }}
                      />
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#f4f4f5', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ArrowDownToLine size={13} color="#38bdf8" />
                          <span>At End</span>
                        </div>
                        <div style={{ fontSize: '10px', color: '#a1a1aa', marginTop: '2px' }}>
                          Append to end of note
                        </div>
                      </div>
                    </label>

                    {/* Option 4: At Cursor */}
                    {hasCursorPosition && (
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '8px',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          backgroundColor: insertionTarget === 'cursor' ? 'rgba(99, 102, 241, 0.12)' : '#18181b',
                          border: `1.5px solid ${insertionTarget === 'cursor' ? '#6366f1' : '#27272a'}`,
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="radio"
                          name="insertionTarget"
                          value="cursor"
                          checked={insertionTarget === 'cursor'}
                          onChange={() => setInsertionTarget('cursor')}
                          style={{ marginTop: '2px' }}
                        />
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: '#f4f4f5', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Type size={13} color="#4ade80" />
                            <span>At Cursor</span>
                          </div>
                          <div style={{ fontSize: '10px', color: '#a1a1aa', marginTop: '2px' }}>
                            Insert at caret position
                          </div>
                        </div>
                      </label>
                    )}

                    {/* Option 5: Replace Document */}
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        backgroundColor: insertionTarget === 'replace' ? 'rgba(239, 68, 68, 0.12)' : '#18181b',
                        border: `1.5px solid ${insertionTarget === 'replace' ? '#ef4444' : '#27272a'}`,
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="insertionTarget"
                        value="replace"
                        checked={insertionTarget === 'replace'}
                        onChange={() => setInsertionTarget('replace')}
                        style={{ marginTop: '2px' }}
                      />
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#f4f4f5', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <RotateCcw size={13} color="#f87171" />
                          <span>Replace Note</span>
                        </div>
                        <div style={{ fontSize: '10px', color: '#a1a1aa', marginTop: '2px' }}>
                          Overwrite note
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Specific Page Sub-Configuration Panel */}
                  {insertionTarget === 'specific-page' && (
                    <div style={{
                      marginTop: '10px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor: '#202024',
                      border: '1px solid #6366f1',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      flexWrap: 'wrap',
                      animation: 'fadeIn 0.15s ease-out',
                    }}>
                      <span style={{ fontSize: '12px', color: '#e4e4e7', fontWeight: 500 }}>
                        Insert:
                      </span>

                      {/* Before / After Button Group */}
                      <div style={{ display: 'flex', backgroundColor: '#18181b', borderRadius: '6px', padding: '2px', border: '1px solid #27272a' }}>
                        <button
                          type="button"
                          className={`btn btn-sm ${pagePosition === 'before' ? 'btn-secondary' : 'btn-ghost'}`}
                          onClick={() => setPagePosition('before')}
                          style={{ padding: '2px 8px', fontSize: '11px' }}
                        >
                          Before
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm ${pagePosition === 'after' ? 'btn-secondary' : 'btn-ghost'}`}
                          onClick={() => setPagePosition('after')}
                          style={{ padding: '2px 8px', fontSize: '11px' }}
                        >
                          After
                        </button>
                      </div>

                      <span style={{ fontSize: '12px', color: '#e4e4e7', fontWeight: 500 }}>
                        Page:
                      </span>

                      {/* Page Number Input Box */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="number"
                          min={1}
                          max={Math.max(1, totalNotePages)}
                          value={targetPageNumber}
                          onChange={(e) => setTargetPageNumber(Math.max(1, parseInt(e.target.value) || 1))}
                          style={{
                            width: '52px',
                            padding: '3px 6px',
                            backgroundColor: '#18181b',
                            border: '1px solid #3f3f46',
                            borderRadius: '6px',
                            color: '#ffffff',
                            fontSize: '13px',
                            fontWeight: 600,
                            textAlign: 'center',
                            outline: 'none',
                          }}
                        />
                        <span style={{ fontSize: '11px', color: '#71717a' }}>
                          (Current note has {totalNotePages} {totalNotePages === 1 ? 'page' : 'pages'})
                        </span>
                      </div>

                      {/* Real-time Confirmation Badge */}
                      <div style={{ fontSize: '11px', color: '#a78bfa', marginLeft: 'auto' }}>
                        ➔ Will insert {pagePosition} Page {targetPageNumber}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>

          {documentData && (
            <button
              className="btn btn-primary"
              disabled={selectedPageNumbers.length === 0}
              onClick={handleExecuteInsert}
              style={{ fontWeight: 600 }}
            >
              <Check size={14} />
              <span>
                Insert {selectedPageNumbers.length} {selectedPageNumbers.length === 1 ? 'Page' : 'Pages'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
