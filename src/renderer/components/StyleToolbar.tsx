import React from 'react';
import { 
  HandwritingSettings, 
  HandwritingFont, 
  PaperType, 
  JitterIntensity 
} from '../types';
import { 
  HANDWRITING_FONTS, 
  PAPER_TYPES, 
  INK_COLORS 
} from '../utils/paperStyles';
import { 
  Type, 
  FileText, 
  Palette, 
  PenTool, 
  Sliders, 
  Layout, 
  Hash, 
  Sparkles,
  Calendar,
  CheckCircle2
} from 'lucide-react';

interface StyleToolbarProps {
  settings: HandwritingSettings;
  onChange: (updated: Partial<HandwritingSettings>) => void;
  onReset: () => void;
}

export const StyleToolbar: React.FC<StyleToolbarProps> = ({
  settings,
  onChange,
  onReset,
}) => {
  return (
    <aside className="settings-sidebar no-print">
      {/* 1. Handwriting Font Selection */}
      <div className="settings-group">
        <div className="settings-group-title">
          <Type size={13} color="#818cf8" />
          <span>Handwriting Style</span>
        </div>

        <select
          className="input-field"
          value={settings.font}
          onChange={(e) => onChange({ font: e.target.value as HandwritingFont })}
          style={{
            fontFamily: `"${settings.font}", cursive`,
            fontSize: '15px',
            marginBottom: '10px',
            cursor: 'pointer',
          }}
        >
          {HANDWRITING_FONTS.map((f) => (
            <option key={f.id} value={f.id} style={{ fontFamily: `"${f.id}", cursive`, fontSize: '15px' }}>
              {f.name} ({f.category})
            </option>
          ))}
        </select>

        {/* Live Font Sample */}
        <div
          style={{
            backgroundColor: '#121214',
            padding: '10px 12px',
            borderRadius: '6px',
            border: '1px solid #27272a',
            fontFamily: `"${settings.font}", cursive`,
            fontSize: '18px',
            color: '#e4e4e7',
            textAlign: 'center',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {HANDWRITING_FONTS.find((f) => f.id === settings.font)?.preview || 'Handwritten sample preview'}
        </div>
      </div>

      {/* 2. Paper Background Selection */}
      <div className="settings-group">
        <div className="settings-group-title">
          <FileText size={13} color="#818cf8" />
          <span>Paper Background</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          {PAPER_TYPES.map((paper) => {
            const isSelected = settings.paperType === paper.id;
            return (
              <button
                key={paper.id}
                onClick={() => {
                  // auto-adjust ruling if college vs regular
                  const newLineHeight = paper.id === 'college' ? 26 : 32;
                  onChange({ paperType: paper.id, lineHeight: newLineHeight });
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 8px',
                  borderRadius: '6px',
                  border: isSelected ? '1.5px solid #6366f1' : '1px solid #27272a',
                  backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.1)' : '#121214',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
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

        {/* Page Size & Orientation */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#a1a1aa', marginBottom: '4px' }}>Format</div>
            <select
              className="input-field"
              value={settings.pageSize}
              onChange={(e) => onChange({ pageSize: e.target.value as any })}
              style={{ fontSize: '12px', padding: '6px' }}
            >
              <option value="A4">A4 Standard</option>
              <option value="Letter">US Letter</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#a1a1aa', marginBottom: '4px' }}>Orientation</div>
            <select
              className="input-field"
              value={settings.orientation}
              onChange={(e) => onChange({ orientation: e.target.value as any })}
              style={{ fontSize: '12px', padding: '6px' }}
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>
        </div>

        {/* Toggles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#d4d4d8', cursor: 'pointer' }}>
            <span>Red Margin Ruler</span>
            <input
              type="checkbox"
              checked={settings.showMarginLine}
              onChange={(e) => onChange({ showMarginLine: e.target.checked })}
              style={{ accentColor: '#6366f1', width: '16px', height: '16px', cursor: 'pointer' }}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#d4d4d8', cursor: 'pointer' }}>
            <span>Binder Punch Holes</span>
            <input
              type="checkbox"
              checked={settings.showHoles}
              onChange={(e) => onChange({ showHoles: e.target.checked })}
              style={{ accentColor: '#6366f1', width: '16px', height: '16px', cursor: 'pointer' }}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#d4d4d8', cursor: 'pointer' }}>
            <span>Top Header (Date & Title)</span>
            <input
              type="checkbox"
              checked={settings.showHeader}
              onChange={(e) => onChange({ showHeader: e.target.checked })}
              style={{ accentColor: '#6366f1', width: '16px', height: '16px', cursor: 'pointer' }}
            />
          </label>
        </div>

        {/* Header Subject & Date if enabled */}
        {settings.showHeader && (
          <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <input
              type="text"
              className="input-field"
              placeholder="Subject / Title (e.g. Physics 101)"
              value={settings.headerSubject}
              onChange={(e) => onChange({ headerSubject: e.target.value })}
              style={{ fontSize: '12px', padding: '6px 8px' }}
            />
            <input
              type="text"
              className="input-field"
              placeholder="Date (e.g. Sep 22, 2026)"
              value={settings.headerDate}
              onChange={(e) => onChange({ headerDate: e.target.value })}
              style={{ fontSize: '12px', padding: '6px 8px' }}
            />
          </div>
        )}

        <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #27272a' }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={onReset}
            style={{ width: '100%', fontSize: '11px', color: '#a1a1aa' }}
          >
            Reset to Default Settings
          </button>
        </div>
      </div>
    </aside>
  );
};
