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
} from 'lucide-react';

interface StyleToolbarProps {
  settings: HandwritingSettings;
  onChange: (newSettings: Partial<HandwritingSettings>) => void;
}

export const StyleToolbar: React.FC<StyleToolbarProps> = ({ settings, onChange }) => {
  return (
    <div className="app-sidebar no-print">
      <div className="sidebar-section-title">
        <span>Style & Stationery</span>
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
                      color: isSelected ? '#a5b4fc' : '#71717a',
                      marginTop: '2px',
                    }}
                  >
                    abc 123
                  </div>
                </div>
                {isSelected && <CheckCircle2 size={15} color="#818cf8" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Paper Stationery */}
      <div className="settings-group">
        <div className="settings-group-title">
          <FileSpreadsheet size={13} color="#818cf8" />
          <span>Notebook Stationery</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
          {PAPER_TYPES.map((paper) => {
            const isSelected = settings.paperType === paper.id;
            return (
              <button
                key={paper.id}
                onClick={() => {
                  const updates: Partial<HandwritingSettings> = { paperType: paper.id };
                  if (paper.id === 'college' && settings.lineHeight > 28) {
                    updates.lineHeight = 26;
                  } else if (paper.id === 'ruled' && settings.lineHeight < 30) {
                    updates.lineHeight = 32;
                  }
                  onChange(updates);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: isSelected ? '1px solid #6366f1' : '1px solid #27272a',
                  backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.12)' : '#18181b',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.1s ease',
                }}
              >
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '3px',
                    backgroundColor: paper.bgColor,
                    border: '1px solid rgba(0,0,0,0.2)',
                    flexShrink: 0,
                  }}
                />
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '12px', fontWeight: isSelected ? 600 : 400, color: isSelected ? '#fff' : '#d4d4d8', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {paper.name}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Ink Color */}
      <div className="settings-group">
        <div className="settings-group-title">
          <Palette size={13} color="#818cf8" />
          <span>Pen Ink Color</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
          {INK_COLORS.map((ink) => {
            const isSelected = settings.inkColor.toLowerCase() === ink.hex.toLowerCase();
            return (
              <button
                key={ink.hex}
                onClick={() => onChange({ inkColor: ink.hex })}
                title={ink.name}
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  backgroundColor: ink.hex,
                  border: isSelected ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.15)',
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 0 0 2px #6366f1' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                }}
              >
                {isSelected && <CheckCircle2 size={12} color="#ffffff" />}
              </button>
            );
          })}

          {/* Custom Color Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
            <input
              type="color"
              value={settings.inkColor}
              onChange={(e) => onChange({ inkColor: e.target.value })}
              title="Custom Hex Color"
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                border: '1px solid #3f3f46',
                cursor: 'pointer',
                background: 'transparent',
                padding: 0,
              }}
            />
            <span style={{ fontSize: '11px', color: '#a1a1aa', fontFamily: 'monospace' }}>
              {settings.inkColor}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Stroke & Handwriting Realism */}
      <div className="settings-group">
        <div className="settings-group-title">
          <Sparkles size={13} color="#818cf8" />
          <span>Realism & Pen Stroke</span>
        </div>

        {/* Pen Weight */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', color: '#a1a1aa', marginBottom: '6px' }}>Pen Weight / Tip</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
            {(['fine', 'regular', 'medium', 'bold'] as const).map((wt) => (
              <button
                key={wt}
                className={`btn btn-sm ${settings.penThickness === wt ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => onChange({ penThickness: wt })}
                style={{ textTransform: 'capitalize', fontSize: '11px', padding: '4px' }}
              >
                {wt}
              </button>
            ))}
          </div>
        </div>

        {/* Natural Jitter */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#a1a1aa', marginBottom: '6px' }}>
            <span>Handwriting Tremor / Jitter</span>
            <span style={{ color: '#818cf8', fontWeight: 600 }}>{settings.jitter}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
            {(['none', 'subtle', 'medium', 'strong'] as JitterIntensity[]).map((jit) => (
              <button
                key={jit}
                className={`btn btn-sm ${settings.jitter === jit ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => onChange({ jitter: jit })}
                style={{ textTransform: 'capitalize', fontSize: '11px', padding: '4px' }}
              >
                {jit}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Typography Sliders */}
      <div className="settings-group">
        <div className="settings-group-title">
          <Sliders size={13} color="#818cf8" />
          <span>Sizing & Line Spacing</span>
        </div>

        {/* Font Size */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#a1a1aa', marginBottom: '4px' }}>
            <span>Font Size</span>
            <span style={{ color: '#f4f4f5' }}>{settings.fontSize}px</span>
          </div>
          <input
            type="range"
            min="14"
            max="30"
            step="1"
            value={settings.fontSize}
            onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
            style={{ width: '100%' }}
          />
        </div>

        {/* Line Height (Ruled Line Spacing) */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#a1a1aa', marginBottom: '4px' }}>
            <span>Paper Line Spacing</span>
            <span style={{ color: '#f4f4f5' }}>{settings.lineHeight}px</span>
          </div>
          <input
            type="range"
            min="22"
            max="46"
            step="2"
            value={settings.lineHeight}
            onChange={(e) => onChange({ lineHeight: Number(e.target.value) })}
            style={{ width: '100%' }}
          />
        </div>

        {/* Baseline Line Alignment (Above Bottom Line) */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#a1a1aa', marginBottom: '4px' }}>
            <span>Line Alignment (Baseline)</span>
            <span style={{ color: '#818cf8', fontWeight: 600 }}>
              {settings.baselineOffset > 0 ? `+${settings.baselineOffset}` : settings.baselineOffset || 0}px
            </span>
          </div>
          <input
            type="range"
            min="-6"
            max="10"
            step="1"
            value={settings.baselineOffset || 0}
            onChange={(e) => onChange({ baselineOffset: Number(e.target.value) })}
            style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#71717a', marginTop: '2px' }}>
            <span>Higher</span>
            <span>On line</span>
            <span>Lower</span>
          </div>
        </div>

        {/* Letter Spacing */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#a1a1aa', marginBottom: '4px' }}>
            <span>Letter Spacing</span>
            <span style={{ color: '#f4f4f5' }}>{settings.letterSpacing}px</span>
          </div>
          <input
            type="range"
            min="-1"
            max="3"
            step="0.5"
            value={settings.letterSpacing}
            onChange={(e) => onChange({ letterSpacing: Number(e.target.value) })}
            style={{ width: '100%' }}
          />
        </div>

        {/* Handwriting Slant */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#a1a1aa', marginBottom: '4px' }}>
            <span>Handwriting Slant</span>
            <span style={{ color: '#f4f4f5' }}>{settings.slant}°</span>
          </div>
          <input
            type="range"
            min="-5"
            max="12"
            step="1"
            value={settings.slant}
            onChange={(e) => onChange({ slant: Number(e.target.value) })}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* 6. Page Format & Notebook Accents */}
      <div className="settings-group">
        <div className="settings-group-title">
          <Layout size={13} color="#818cf8" />
          <span>Paper Format & Accents</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Red Margin Line Toggle */}
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#d4d4d8', cursor: 'pointer' }}>
            <span>Red Margin Guide</span>
            <input
              type="checkbox"
              checked={settings.showMarginLine}
              onChange={(e) => onChange({ showMarginLine: e.target.checked })}
            />
          </label>

          {/* 3-Hole Binder Punches */}
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#d4d4d8', cursor: 'pointer' }}>
            <span>Binder Hole Punches</span>
            <input
              type="checkbox"
              checked={settings.showHoles}
              onChange={(e) => onChange({ showHoles: e.target.checked })}
            />
          </label>
        </div>
      </div>
    </div>
  );
};
