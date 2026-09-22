import React from 'react';
import { SAMPLE_TEMPLATES } from '../utils/defaultTemplates';
import { SampleTemplate, HandwritingSettings } from '../types';
import { BookOpen, X, Sparkles, Check } from 'lucide-react';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: SampleTemplate) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={18} color="#a855f7" />
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#f4f4f5' }}>
              Sample Markdown Notes & Templates
            </h2>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '13px', color: '#a1a1aa', marginBottom: '16px' }}>
            Choose a curated handwritten note template to quickly explore different handwriting styles, paper ruling, and layouts.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {SAMPLE_TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.id}
                style={{
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  padding: '14px',
                  backgroundColor: '#141417',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'border-color 0.15s ease',
                }}
              >
                <div style={{ flex: 1, paddingRight: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span className="badge">{tmpl.category}</span>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#f4f4f5' }}>
                      {tmpl.title}
                    </h3>
                  </div>
                  <p style={{ fontSize: '12px', color: '#a1a1aa', lineHeight: 1.4 }}>
                    {tmpl.description}
                  </p>
                  {tmpl.recommendedSettings && (
                    <div style={{ marginTop: '6px', fontSize: '11px', color: '#71717a' }}>
                      Recommended: Font <strong>{tmpl.recommendedSettings.font}</strong> • Paper <strong>{tmpl.recommendedSettings.paperType}</strong>
                    </div>
                  )}
                </div>

                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    onSelectTemplate(tmpl);
                    onClose();
                  }}
                  style={{ flexShrink: 0 }}
                >
                  <Sparkles size={13} />
                  <span>Load Note</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
