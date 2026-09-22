import React, { useRef } from 'react';
import { HandwritingSettings } from '../types';
import { PAGE_DIMENSIONS, getComputedBaselineShift } from '../utils/paperStyles';
import { parseMarkdownToHtml } from '../utils/markdownParser';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2
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

  // Dimensions based on page size & orientation with safe fallbacks
  const pageSize = settings?.pageSize && PAGE_DIMENSIONS[settings.pageSize] ? settings.pageSize : 'A4';
  const orientation = settings?.orientation === 'landscape' ? 'landscape' : 'portrait';
  const pageDims = PAGE_DIMENSIONS[pageSize][orientation];

  // Pen stroke thickness class
  const penClass = `pen-${settings?.penThickness || 'regular'}`;

  // Jitter class
  const jitterClass = settings?.jitter && settings.jitter !== 'none' ? `jitter-${settings.jitter}` : '';

  // Calculate font baseline shift to place words comfortably in the line space
  // resting right above the bottom ruled line
  const computedBaselineShift = getComputedBaselineShift(
    settings?.font || 'Caveat',
    settings?.fontSize || 20,
    settings?.lineHeight || 32,
    settings?.baselineOffset || 0
  );

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

  const lineHeight = settings?.lineHeight || 32;
  const topPadding = lineHeight;

  return (
    <div className="preview-pane">
      {/* Zoom and Page Nav Toolbar */}
      <div className="preview-toolbar no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, overflow: 'hidden' }}>
          {pages.length > 1 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              overflowX: 'auto',
              maxWidth: '240px',
              scrollbarWidth: 'none',
              whiteSpace: 'nowrap',
            }}>
              <span style={{ fontSize: '12px', color: '#a1a1aa', flexShrink: 0 }}>Page:</span>
              {pages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => scrollToPage(idx)}
                  className="btn btn-ghost btn-sm"
                  style={{
                    padding: '2px 7px',
                    fontSize: '11px',
                    minWidth: '22px',
                    height: '22px',
                    flexShrink: 0,
                  }}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Zoom Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleZoomOut}
            title="Zoom Out (Ctrl -)"
            style={{ padding: '4px 6px' }}
          >
            <ZoomOut size={14} />
          </button>

          <button
            className="btn btn-ghost btn-sm"
            onClick={handleResetZoom}
            title="Reset Zoom to 100%"
            style={{ fontSize: '11px', minWidth: '45px', padding: '4px' }}
          >
            {zoom}%
          </button>

          <button
            className="btn btn-ghost btn-sm"
            onClick={handleZoomIn}
            title="Zoom In (Ctrl +)"
            style={{ padding: '4px 6px' }}
          >
            <ZoomIn size={14} />
          </button>
        </div>
      </div>

      {/* Pages Container */}
      <div className="preview-scroll-area" ref={containerRef}>
        <div
          className="sheets-wrapper"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
            gap: '32px',
            alignItems: 'center',
          }}
        >
          {pages.map((pageMarkdown, pageIndex) => {
            const pageHtml = parseMarkdownToHtml(pageMarkdown);

            return (
              <div
                id={`paper-page-${pageIndex}`}
                key={pageIndex}
                className={`paper-sheet paper-${settings?.paperType || 'ruled'} ${penClass} ${jitterClass}`}
                style={{
                  width: `${pageDims.width}px`,
                  height: `${pageDims.height}px`,
                  fontFamily: `"${settings?.font || 'Caveat'}", cursive, sans-serif`,
                  fontSize: `${settings?.fontSize || 20}px`,
                  lineHeight: `${lineHeight}px`,
                  letterSpacing: `${settings?.letterSpacing || 0}px`,
                  wordSpacing: `${settings?.wordSpacing || 0}px`,
                  color: settings?.inkColor || '#1e3a8a',
                  transform: `rotate(${settings?.slant || 0}deg)`,
                  backgroundColor: settings?.paperColor || undefined,
                  ['--line-height' as any]: `${lineHeight}px`,
                  ['--baseline-shift' as any]: `${computedBaselineShift}px`,
                  ['--margin-width' as any]: `${settings?.marginLineWidth || 80}px`,
                }}
              >
                {/* Red Margin Line */}
                {settings?.showMarginLine && <div className="paper-margin-line" />}

                {/* Binder Punch Holes */}
                {settings?.showHoles && (
                  <div className="paper-holes">
                    <div className="paper-hole" />
                    <div className="paper-hole" />
                    <div className="paper-hole" />
                  </div>
                )}

                {/* Header (Date & Subject) */}
                {settings?.showHeader && (
                  <div className="paper-header">
                    <div className="paper-header-date">
                      <span>Date: </span>
                      <span className="paper-header-value">
                        {settings?.headerDate || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="paper-header-subject">
                      <span>Subject: </span>
                      <span className="paper-header-value">
                        {settings?.headerSubject || 'Notes'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Handwritten Content Area */}
                <div
                  className="paper-content"
                  style={{
                    paddingTop: `${topPadding}px`,
                    paddingLeft: settings?.showMarginLine ? `${(settings?.marginLineWidth || 80) + 16}px` : '48px',
                    paddingRight: '48px',
                  }}
                  dangerouslySetInnerHTML={{ __html: pageHtml }}
                />

                {/* Page Number */}
                {settings?.showPageNumbers && (
                  <div className="paper-page-number">
                    {settings?.pageNumberStyle === 'x-of-y'
                      ? `${pageIndex + 1} / ${pages.length}`
                      : settings?.pageNumberStyle === 'number-only'
                      ? `${pageIndex + 1}`
                      : `Page ${pageIndex + 1}`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
