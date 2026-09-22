import React from 'react';
import { HandwritingSettings, JitterIntensity } from '../types';
import { HANDWRITING_FONTS, PAPER_TYPES, INK_COLORS } from '../utils/paperStyles';
import {
  Type,
  FileSpreadsheet,
  Palette,
  Sparkles,
  Sliders,
  Layout,
  CheckCircle2,
  X,
} from 'lucide-react';

interface StyleToolbarProps {
  settings: HandwritingSettings;
  onChange: (newSettings: Partial<HandwritingSettings>) => void;
  onClose?: () => void;
}

export const StyleToolbar: React.FC<StyleToolbarProps> = ({ settings, onChange, onClose }) => {
  return (
    <div className="app-sidebar no-print" style={{ paddingBottom: '32px' }}>
      <div className="sidebar-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Style & Stationery</span>
        {onClose && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            title="Close Styles Sidebar"
            style={{ padding: '2px 6px', height: '22px' }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* 1. Handwriting Font */}
      <div className="settings-group">
        <div className="settings-group-title">
          <Type size={13} color="#818cf8" />
          <span>Handwriting Style</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '210px', overflowY: 'auto', paddingRight: '4px' }}>
          {HANDWRITING_FONTS.map((font) => {
            const isSelected = settings.font === font.id;
            return (
              <button
                key={font.id}
                onClick={() => onChange({ font: font.id })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  border: isSelected ? '1px solid #6366f1' : '1px solid #27272a',
                  backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : '#18181b',
                  color: isSelected ? '#ffffff' : '#a1a1aa',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.1s ease',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: isSelected ? 600 : 400, color: isSelected ? '#fff' : '#e4e4e7' }}>
                    {font.name}
                  </div>
                  <div
                    style={{
                      fontFamily: `"${font.id}", cursive, sans-serif`,
                      fontSize: '15px',
                      color: isSelected ? '#818cf8' : '#71717a',
                      marginTop: '2px',
                    }}
                  >
                    The quick brown fox jumps
                  </div>
                </div>
                {isSelected && <CheckCircle2 size={16} color="#818cf8" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Paper Texture & Type */}
      <div className="settings-group">
        <div className="settings-group-title">
          <FileSpreadsheet size={13} color="#818cf8" />
          <span>Paper Texture</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
          {PAPER_TYPES.map((paper) => {
            const isSelected = settings.paperType === paper.id;
            return (
              <button
                key={paper.id}
                onClick={() => onChange({ paperType: paper.id })}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: isSelected ? '1px solid #6366f1' : '1px solid #27272a',
                  backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : '#18181b',
                  color: isSelected ? '#ffffff' : '#a1a1aa',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.1s ease',
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 600, color: isSelected ? '#fff' : '#e4e4e7' }}>
                  {paper.name}
                </span>
                <span style={{ fontSize: '10px', color: '#71717a', marginTop: '2px' }}>
                  {paper.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Ink Color */}
      <div className="settings-group">
        <div className="settings-group-title">
          <Palette size={13} color="#818cf8" />
          <span>Ink Color</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
          {INK_COLORS.map((ink) => {
            const isSelected = settings.inkColor === ink.color;
            return (
              <button
                key={ink.name}
                onClick={() => onChange({ inkColor: ink.color })}
                title={ink.name}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '6px 4px',
                  borderRadius: '6px',
                  border: isSelected ? '2px solid #6366f1' : '1px solid #27272a',
                  backgroundColor: isSelected ? '#202024' : '#18181b',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: ink.color,
                    border: '1px solid rgba(255,255,255,0.2)',
                    marginBottom: '4px',
                  }}
                />
                <span style={{ fontSize: '10px', color: isSelected ? '#fff' : '#71717a' }}>
                  {ink.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Pen Stroke Thickness */}
      <div className="settings-group">
        <div className="settings-group-title">
          <Sliders size={13} color="#818cf8" />
          <span>Pen Thickness</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
          {(['fine', 'regular', 'medium', 'bold'] as const).map((thickness) => {
            const isSelected = settings.penThickness === thickness;
            return (
              <button
                key={thickness}
                onClick={() => onChange({ penThickness: thickness })}
                style={{
                  padding: '6px 0',
                  borderRadius: '6px',
                  border: isSelected ? '1px solid #6366f1' : '1px solid #27272a',
                  backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : '#18181b',
                  color: isSelected ? '#ffffff' : '#a1a1aa',
                  fontSize: '11px',
                  fontWeight: 500,
                  textTransform: 'capitalize',
                  cursor: 'pointer',
                }}
              >
                {thickness}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Human Natural Jitter */}
      <div className="settings-group">
        <div className="settings-group-title">
          <Sparkles size={13} color="#818cf8" />
          <span>Natural Jitter</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
          {(['none', 'subtle', 'medium', 'strong'] as const).map((intensity) => {
            const isSelected = settings.jitter === intensity;
            return (
              <button
                key={intensity}
                onClick={() => onChange({ jitter: intensity })}
                style={{
                  padding: '6px 0',
                  borderRadius: '6px',
                  border: isSelected ? '1px solid #6366f1' : '1px solid #27272a',
                  backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : '#18181b',
                  color: isSelected ? '#ffffff' : '#a1a1aa',
                  fontSize: '11px',
                  fontWeight: 500,
                  textTransform: 'capitalize',
                  cursor: 'pointer',
                }}
              >
                {intensity}
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. Typography Sliders */}
      <div className="settings-group">
        <div className="settings-group-title">
          <Sliders size={13} color="#818cf8" />
          <span>Font & Line Metrics</span>
        </div>

        {/* Font Size */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
            <span style={{ color: '#a1a1aa' }}>Font Size</span>
            <span style={{ color: '#f4f4f5', fontWeight: 600 }}>{settings.fontSize}px</span>
          </div>
          <input
            type="range"
            min={14}
            max={32}
            value={settings.fontSize}
            onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
            style={{ width: '100%', accentColor: '#6366f1' }}
          />
        </div>

        {/* Line Height */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
            <span style={{ color: '#a1a1aa' }}>Line Height (Ruling)</span>
            <span style={{ color: '#f4f4f5', fontWeight: 600 }}>{settings.lineHeight}px</span>
          </div>
          <input
            type="range"
            min={24}
            max={48}
            value={settings.lineHeight}
            onChange={(e) => onChange({ lineHeight: Number(e.target.value) })}
            style={{ width: '100%', accentColor: '#6366f1' }}
          />
        </div>

        {/* Letter Spacing */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
            <span style={{ color: '#a1a1aa' }}>Letter Spacing</span>
            <span style={{ color: '#f4f4f5', fontWeight: 600 }}>{settings.letterSpacing}px</span>
          </div>
          <input
            type="range"
            min={-2}
            max={6}
            step={0.5}
            value={settings.letterSpacing}
            onChange={(e) => onChange({ letterSpacing: Number(e.target.value) })}
            style={{ width: '100%', accentColor: '#6366f1' }}
          />
        </div>

        {/* Baseline Alignment Offset */}
        <div style={{ marginBottom: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
            <span style={{ color: '#a1a1aa' }}>Baseline Offset</span>
            <span style={{ color: '#f4f4f5', fontWeight: 600 }}>{settings.baselineOffset}px</span>
          </div>
          <input
            type="range"
            min={-10}
            max={15}
            value={settings.baselineOffset}
            onChange={(e) => onChange({ baselineOffset: Number(e.target.value) })}
            style={{ width: '100%', accentColor: '#6366f1' }}
          />
        </div>
      </div>

      {/* 7. Page Layout & Details */}
      <div className="settings-group">
        <div className="settings-group-title">
          <Layout size={13} color="#818cf8" />
          <span>Sheet Details</span>
        </div>

        {/* Margin line toggle */}
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', cursor: 'pointer' }}>
          <span style={{ fontSize: '12px', color: '#e4e4e7' }}>Red Margin Line</span>
          <input
            type="checkbox"
            checked={settings.showMarginLine}
            onChange={(e) => onChange({ showMarginLine: e.target.checked })}
            style={{ accentColor: '#6366f1' }}
          />
        </label>

        {/* Binder holes toggle */}
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', cursor: 'pointer' }}>
          <span style={{ fontSize: '12px', color: '#e4e4e7' }}>Binder Punch Holes</span>
          <input
            type="checkbox"
            checked={settings.showHoles}
            onChange={(e) => onChange({ showHoles: e.target.checked })}
            style={{ accentColor: '#6366f1' }}
          />
        </label>

        {/* Header date/subject toggle */}
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', cursor: 'pointer' }}>
          <span style={{ fontSize: '12px', color: '#e4e4e7' }}>Header Date & Subject</span>
          <input
            type="checkbox"
            checked={settings.showHeader}
            onChange={(e) => onChange({ showHeader: e.target.checked })}
            style={{ accentColor: '#6366f1' }}
          />
        </label>

        {/* Show Page Numbers */}
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
          <span style={{ fontSize: '12px', color: '#e4e4e7' }}>Page Numbers</span>
          <input
            type="checkbox"
            checked={settings.showPageNumbers}
            onChange={(e) => onChange({ showPageNumbers: e.target.checked })}
            style={{ accentColor: '#6366f1' }}
          />
        </label>
      </div>
    </div>
  );
};
