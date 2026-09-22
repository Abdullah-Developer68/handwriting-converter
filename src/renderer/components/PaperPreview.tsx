import React, { useRef } from 'react';
import { HandwritingSettings } from '../types';
import { PAGE_DIMENSIONS } from '../utils/paperStyles';
import { parseMarkdownToHtml } from '../utils/markdownParser';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  ChevronLeft, 
  ChevronRight,
  FileText
} from 'lucide-react';

interface PaperPreviewProps {
  pages: string[];
  settings: HandwritingSettings;
  zoom: number;
  setZoom: (zoom: number | ((prev: number) => number)) => void;
}

export const PaperPreview: React.FC<PaperPreviewProps> = ({
  pages,
  settings,
  zoom,
  setZoom,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Dimensions based on page size & orientation
  const pageDims = PAGE_DIMENSIONS[settings.pageSize][settings.orientation];

  // Pen stroke thickness class
  const penClass = `pen-${settings.penThickness}`;

  // Jitter class
  const jitterClass = settings.jitter !== 'none' ? `jitter-${settings.jitter}` : '';

  const handleZoomIn = () => {
    setZoom((z) => Math.min(200, z + 15));
  };

  const handleZoomOut = () => {
    setZoom((z) => Math.max(40, z - 15));
  };

  const handleResetZoom = () => {
    setZoom(100);
  };

  const scrollToPage = (pageIndex: number) => {
    const pageEl = document.getElementById(`paper-page-${pageIndex}`);
    if (pageEl) {
      pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="preview-pane">
      {/* Zoom and Page Nav Toolbar */}
      <div className="preview-toolbar no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#d4d4d8' }}>
            <FileText size={15} color="#6366f1" />
            <span style={{ fontWeight: 600 }}>
              {pages.length} {pages.length === 1 ? 'Sheet' : 'Sheets'}
            </span>
            <span style={{ color: '#71717a', fontSize: '12px' }}>
              ({settings.pageSize} • {settings.paperType})
            </span>
          </div>

          {pages.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '12px' }}>
              <span style={{ fontSize: '12px', color: '#a1a1aa' }}>Jump:</span>
              {pages.map((_, idx) => (
                <button
                  key={idx}
                  className="btn btn-ghost btn-sm"
                  onClick={() => scrollToPage(idx)}
                  style={{
                    padding: '2px 7px',
                    fontSize: '11px',
                    height: '24px',
                    backgroundColor: '#27272a',
                  }}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Zoom controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleZoomOut}
            title="Zoom Out"
            style={{ padding: '4px 6px' }}
          >
            <ZoomOut size={14} />
          </button>
          
          <span style={{ fontSize: '12px', fontWeight: 600, minWidth: '42px', textAlign: 'center', color: '#e4e4e7' }}>
            {zoom}%
          </span>

          <button
            className="btn btn-ghost btn-sm"
            onClick={handleZoomIn}
            title="Zoom In"
            style={{ padding: '4px 6px' }}
          >
            <ZoomIn size={14} />
          </button>

          <button
            className="btn btn-ghost btn-sm"
            onClick={handleResetZoom}
            title="Reset Zoom to 100%"
            style={{ padding: '4px 6px', fontSize: '11px', marginLeft: '4px' }}
          >
            <Maximize2 size={13} />
          </button>
        </div>
      </div>

      {/* Main Preview Scroll Area */}
      <div 
        ref={containerRef} 
        className="preview-scroll-area"
        style={{
          perspective: '1000px',
        }}
      >
        {/* Printable Area - strictly used by Electron printToPDF and on-screen preview */}
        <div
          id="printable-area"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            display: 'flex',
            flexDirection: 'column',
            gap: '36px',
            alignItems: 'center',
            transition: 'transform 0.1s ease-out',
          }}
        >
          {pages.map((pageMarkdown, index) => {
            const pageHtml = parseMarkdownToHtml(pageMarkdown);
            const pageNum = index + 1;
            const totalPages = pages.length;

            return (
              <div
                key={index}
                id={`paper-page-${index}`}
                className={`paper-sheet paper-${settings.paperType}`}
                style={{
                  width: `${pageDims.width}px`,
                  minHeight: `${pageDims.height}px`,
                  // CSS Custom properties for paper ruling & text
                  ['--line-height' as any]: `${settings.lineHeight}px`,
                  ['--font-size' as any]: `${settings.fontSize}px`,
                  ['--ink-color' as any]: settings.paperType === 'chalkboard' ? '#f8fafc' : settings.inkColor,
                  ['--margin-left' as any]: `${settings.marginLineWidth}px`,
                }}
              >
                {/* 3 Left Binder Punch Holes */}
                {settings.showHoles && (
                  <>
                    <div className="paper-hole-punch paper-hole-top" />
                    <div className="paper-hole-punch paper-hole-mid" />
                    <div className="paper-hole-punch paper-hole-bot" />
                  </>
                )}

                {/* Vertical Red Margin Line */}
                {settings.showMarginLine && <div className="paper-margin-line" />}

                {/* Paper Content Wrapper with Margins */}
                <div
                  style={{
                    paddingTop: '36px',
                    paddingBottom: '48px',
                    paddingLeft: `${settings.marginLineWidth + (settings.showHoles ? 24 : 16)}px`,
                    paddingRight: '42px',
                    fontFamily: `"${settings.font}", cursive, sans-serif`,
                    letterSpacing: `${settings.letterSpacing}px`,
                    wordSpacing: `${settings.wordSpacing}px`,
                    transform: settings.slant !== 0 ? `skewX(${settings.slant}deg)` : undefined,
                  }}
                >
                  {/* Top Header / Notebook Meta */}
                  {settings.showHeader && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        borderBottom: '1px solid currentColor',
                        paddingBottom: '6px',
                        marginBottom: `${settings.lineHeight * 0.8}px`,
                        opacity: 0.82,
                        fontSize: `${settings.fontSize * 0.85}px`,
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>
                        {settings.headerSubject || 'Notes'}
                      </div>
                      <div style={{ display: 'flex', gap: '20px' }}>
                        {settings.headerDate && (
                          <span>
                            <strong>Date:</strong> {settings.headerDate}
                          </span>
                        )}
                        {settings.showPageNumbers && (
                          <span>
                            {settings.pageNumberStyle === 'x-of-y' && `Page ${pageNum} of ${totalPages}`}
                            {settings.pageNumberStyle === 'page-x' && `Page ${pageNum}`}
                            {settings.pageNumberStyle === 'number-only' && `${pageNum}`}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Rendered Markdown Body */}
                  <div
                    className={`handwriting-content ${penClass} ${jitterClass}`}
                    dangerouslySetInnerHTML={{ __html: pageHtml }}
                  />

                  {/* Bottom Page Number if Header is disabled */}
                  {!settings.showHeader && settings.showPageNumbers && (
                    <div
                      style={{
                        marginTop: `${settings.lineHeight}px`,
                        textAlign: 'right',
                        opacity: 0.75,
                        fontSize: `${settings.fontSize * 0.8}px`,
                      }}
                    >
                      - {pageNum} -
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
