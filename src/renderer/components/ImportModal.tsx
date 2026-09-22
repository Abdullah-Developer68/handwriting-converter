import React, { useState, useEffect, useMemo } from 'react';
import { ParsedDocument, InsertionTarget } from '../types';
import { 
  FileUp, 
  FileDown,
  FileText, 
  File, 
  CheckSquare, 
  Square, 
  Search, 
  X, 
  ArrowDownToLine, 
  PlusSquare, 
  FilePlus, 
  RotateCcw, 
  Loader2, 
  AlertCircle,
  HelpCircle,
  Eye,
  Check
} from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (content: string, target: InsertionTarget) => void;
  initialFile?: File | null;
  hasCursorPosition: boolean;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onInsert,
  initialFile,
  hasCursorPosition,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [documentData, setDocumentData] = useState<ParsedDocument | null>(null);
  const [selectedPageNumbers, setSelectedPageNumbers] = useState<number[]>([]);
  const [activePreviewPageNum, setActivePreviewPageNum] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [insertionTarget, setInsertionTarget] = useState<InsertionTarget>(
    hasCursorPosition ? 'cursor' : 'new-page'
  );
  const [isDragging, setIsDragging] = useState<boolean>(false);

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
      }
    } catch (err: any) {
      console.error('Failed to parse file:', err);
      setErrorMessage(err.message || 'Failed to parse file');
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger Native OS file picker
  const handlePickFile = async () => {
    if (window.electronAPI?.importDocument) {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const parsed = await window.electronAPI.importDocument();
        if (parsed) {
          setDocumentData(parsed);
          const allNums = parsed.pages.map((p) => p.pageNumber);
          setSelectedPageNumbers(allNums);
          setActivePreviewPageNum(allNums[0] || null);
        }
      } catch (err: any) {
        console.error('Failed to import document:', err);
        setErrorMessage(err.message || 'Failed to open file');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Browser fallback file input
      const input = window.document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,.docx,.doc,.md,.markdown,.txt';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          handleProcessFile(file);
        }
      };
      input.click();
    }
  };

  // Drag and drop handlers for modal dropzone
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

  // Toggle single page selection
  const togglePageSelection = (pageNum: number) => {
    setSelectedPageNumbers((prev) =>
      prev.includes(pageNum) ? prev.filter((n) => n !== pageNum) : [...prev, pageNum].sort((a, b) => a - b)
    );
  };

  // Select all / deselect all
  const selectAllPages = () => {
    if (!documentData) return;
    setSelectedPageNumbers(documentData.pages.map((p) => p.pageNumber));
  };

  const deselectAllPages = () => {
    setSelectedPageNumbers([]);
  };

  // Filtered pages
  const filteredPages = useMemo(() => {
    if (!documentData) return [];
    if (!searchQuery.trim()) return documentData.pages;
    const query = searchQuery.toLowerCase();
    return documentData.pages.filter(
      (p) =>
        p.text.toLowerCase().includes(query) ||
        `page ${p.pageNumber}`.toLowerCase().includes(query)
    );
  }, [documentData, searchQuery]);

  // Content for active preview
  const activePreviewText = useMemo(() => {
    if (!documentData || activePreviewPageNum === null) return '';
    const page = documentData.pages.find((p) => p.pageNumber === activePreviewPageNum);
    return page ? page.text : '';
  }, [documentData, activePreviewPageNum]);

  // Insert handler
  const handleExecuteInsert = () => {
    if (!documentData || selectedPageNumbers.length === 0) return;

    // Filter and combine selected pages in numerical order
    const pagesToInsert = documentData.pages
      .filter((p) => selectedPageNumbers.includes(p.pageNumber))
      .sort((a, b) => a.pageNumber - b.pageNumber);

    let contentToInsert = '';
    if (insertionTarget === 'new-page') {
      contentToInsert = pagesToInsert.map((p) => p.text).join('\n\n<!-- pagebreak -->\n\n');
    } else {
      contentToInsert = pagesToInsert.map((p) => p.text).join('\n\n<!-- pagebreak -->\n\n');
    }

    onInsert(contentToInsert, insertionTarget);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
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
                Import Pages from Document
              </h2>
              <div style={{ fontSize: '11px', color: '#a1a1aa' }}>
                Extract pages from PDF, Word, Google Docs (.docx) & insert anywhere
              </div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
              <div style={{ fontSize: '13px', fontWeight: 500 }}>Parsing document pages...</div>
            </div>
          )}

          {/* State 1: No file loaded yet -> Upload / Dropzone */}
          {!isLoading && !documentData && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handlePickFile}
              style={{
                border: `2px dashed ${isDragging ? '#6366f1' : '#3f3f46'}`,
                backgroundColor: isDragging ? 'rgba(99, 102, 241, 0.08)' : '#18181b',
                borderRadius: '12px',
                padding: '36px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '14px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#27272a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818cf8',
              }}>
                <FileUp size={28} />
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#f4f4f5' }}>
                  Choose a PDF or Word / Google Docs file
                </div>
                <div style={{ fontSize: '12px', color: '#71717a', marginTop: '4px' }}>
                  Drag & drop or click to select from your computer
                </div>
              </div>

              {/* Supported Badges */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', backgroundColor: '#27272a', color: '#ef4444' }}>
                  PDF (.pdf)
                </span>
                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', backgroundColor: '#27272a', color: '#3b82f6' }}>
                  Word & Google Docs (.docx)
                </span>
                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', backgroundColor: '#27272a', color: '#10b981' }}>
                  Markdown (.md)
                </span>
              </div>
            </div>
          )}

          {/* State 2: Document Loaded */}
          {!isLoading && documentData && (
            <>
              {/* Document Overview Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                backgroundColor: '#202024',
                borderRadius: '8px',
                border: '1px solid #27272a',
                gap: '10px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <FileText size={20} color={documentData.type === 'pdf' ? '#ef4444' : '#3b82f6'} style={{ flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#f4f4f5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {documentData.filename}
                    </div>
                    <div style={{ fontSize: '11px', color: '#71717a' }}>
                      {documentData.type.toUpperCase()} • {documentData.totalPages} {documentData.totalPages === 1 ? 'page' : 'pages'}
                    </div>
                  </div>
                </div>

                <button className="btn btn-secondary btn-sm" onClick={handlePickFile} style={{ flexShrink: 0 }}>
                  <FilePlus size={13} />
                  <span>Change File</span>
                </button>
              </div>

              {/* Page Selection Controls */}
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
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
                    </div>
                  )}
                </div>

                {/* Two Column Layout: Page List & Live Preview */}
                <div className="import-modal-grid">
                  {/* Page List Cards */}
                  <div style={{
                    overflowY: 'auto',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    backgroundColor: '#18181b',
                    padding: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
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
                              <span style={{ fontSize: '10px', color: '#71717a' }}>
                                ({page.text.split('\n').filter(Boolean).length} lines)
                              </span>
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
                        </div>
                      );
                    })}

                    {filteredPages.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '20px', color: '#71717a', fontSize: '12px' }}>
                        No pages match your filter
                      </div>
                    )}
                  </div>

                  {/* Page Preview Box */}
                  <div style={{
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    backgroundColor: '#141416',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      padding: '6px 10px',
                      backgroundColor: '#1c1c20',
                      borderBottom: '1px solid #27272a',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#a1a1aa',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                      <span>Page {activePreviewPageNum || 1} Preview</span>
                      <Eye size={12} />
                    </div>
                    <div style={{
                      padding: '10px',
                      overflowY: 'auto',
                      flex: 1,
                      fontSize: '11px',
                      color: '#d4d4d8',
                      fontFamily: 'monospace',
                      lineHeight: '1.4',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}>
                      {activePreviewText || 'Click any page to preview its text content'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Where to Insert */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#e4e4e7', display: 'block', marginBottom: '8px' }}>
                  Where to Insert Content:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px' }}>
                  {/* Option 1: At Cursor */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      padding: '9px',
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
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#f4f4f5' }}>
                        📍 At Cursor
                      </div>
                      <div style={{ fontSize: '10px', color: '#a1a1aa', marginTop: '2px' }}>
                        Insert where cursor is
                      </div>
                    </div>
                  </label>

                  {/* Option 2: As New Handwritten Page */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      padding: '9px',
                      borderRadius: '8px',
                      backgroundColor: insertionTarget === 'new-page' ? 'rgba(99, 102, 241, 0.12)' : '#18181b',
                      border: `1.5px solid ${insertionTarget === 'new-page' ? '#6366f1' : '#27272a'}`,
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="insertionTarget"
                      value="new-page"
                      checked={insertionTarget === 'new-page'}
                      onChange={() => setInsertionTarget('new-page')}
                      style={{ marginTop: '2px' }}
                    />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#f4f4f5' }}>
                        📄 New Sheet(s)
                      </div>
                      <div style={{ fontSize: '10px', color: '#a1a1aa', marginTop: '2px' }}>
                        Create fresh page(s)
                      </div>
                    </div>
                  </label>

                  {/* Option 3: Append to End */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      padding: '9px',
                      borderRadius: '8px',
                      backgroundColor: insertionTarget === 'append' ? 'rgba(99, 102, 241, 0.12)' : '#18181b',
                      border: `1.5px solid ${insertionTarget === 'append' ? '#6366f1' : '#27272a'}`,
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="insertionTarget"
                      value="append"
                      checked={insertionTarget === 'append'}
                      onChange={() => setInsertionTarget('append')}
                      style={{ marginTop: '2px' }}
                    />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#f4f4f5' }}>
                        ⬇️ Append to End
                      </div>
                      <div style={{ fontSize: '10px', color: '#a1a1aa', marginTop: '2px' }}>
                        Add after last page
                      </div>
                    </div>
                  </label>

                  {/* Option 4: Replace Entire Note */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      padding: '9px',
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
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#f4f4f5' }}>
                        🔄 Replace Note
                      </div>
                      <div style={{ fontSize: '10px', color: '#a1a1aa', marginTop: '2px' }}>
                        Overwrite current note
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
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
