import React, { useRef } from 'react';
import { 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  List, 
  CheckSquare, 
  Quote, 
  Highlighter, 
  Scissors, 
  Table, 
  FileUp,
  RotateCcw
} from 'lucide-react';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  onDropFile: (file: File) => void;
}

export const Editor: React.FC<EditorProps> = ({ value, onChange, onDropFile }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertTextAtCursor = (before: string, after: string = '', defaultMiddle: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;
    const selectedText = currentText.substring(start, end) || defaultMiddle;

    const newText = currentText.substring(0, start) + before + selectedText + after + currentText.substring(end);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 10);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onDropFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="editor-pane" onDragOver={handleDragOver} onDrop={handleDrop}>
      {/* Editor Sub-toolbar */}
      <div className="editor-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => insertTextAtCursor('**', '**', 'bold text')}
            title="Bold (**text**)"
            style={{ padding: '3px 6px' }}
          >
            <Bold size={13} />
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => insertTextAtCursor('*', '*', 'italic text')}
            title="Italic (*text*)"
            style={{ padding: '3px 6px' }}
          >
            <Italic size={13} />
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => insertTextAtCursor('==', '==', 'highlighted text')}
            title="Handwritten Highlighter (==text==)"
            style={{ padding: '3px 6px', color: '#facc15' }}
          >
            <Highlighter size={13} />
          </button>

          <div style={{ width: '1px', height: '14px', backgroundColor: '#3f3f46', margin: '0 3px' }} />

          <button
            className="btn btn-ghost btn-sm"
            onClick={() => insertTextAtCursor('# ', '', 'Heading 1')}
            title="Heading 1 (#)"
            style={{ padding: '3px 6px' }}
          >
            <Heading1 size={14} />
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => insertTextAtCursor('## ', '', 'Heading 2')}
            title="Heading 2 (##)"
            style={{ padding: '3px 6px' }}
          >
            <Heading2 size={14} />
          </button>

          <div style={{ width: '1px', height: '14px', backgroundColor: '#3f3f46', margin: '0 3px' }} />

          <button
            className="btn btn-ghost btn-sm"
            onClick={() => insertTextAtCursor('- ', '', 'List item')}
            title="Bullet list (- )"
            style={{ padding: '3px 6px' }}
          >
            <List size={13} />
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => insertTextAtCursor('- [ ] ', '', 'Task item')}
            title="Task list checkbox (- [ ])"
            style={{ padding: '3px 6px' }}
          >
            <CheckSquare size={13} />
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => insertTextAtCursor('> ', '', 'Quote text')}
            title="Blockquote (> )"
            style={{ padding: '3px 6px' }}
          >
            <Quote size={13} />
          </button>

          <div style={{ width: '1px', height: '14px', backgroundColor: '#3f3f46', margin: '0 3px' }} />

          <button
            className="btn btn-ghost btn-sm"
            onClick={() => insertTextAtCursor('\n| Column 1 | Column 2 |\n| :--- | :--- |\n| Item 1 | Item 2 |\n')}
            title="Insert Table"
            style={{ padding: '3px 6px' }}
          >
            <Table size={13} />
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => insertTextAtCursor('\n\n<!-- pagebreak -->\n\n')}
            title="Insert Page Break (starts a new handwritten sheet)"
            style={{ padding: '3px 6px', color: '#a78bfa' }}
          >
            <Scissors size={13} />
            <span style={{ fontSize: '11px', marginLeft: '3px' }}>Page Break</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#71717a' }}>
          <span>Drop .md here</span>
          <FileUp size={12} />
        </div>
      </div>

      {/* Main Markdown Textarea */}
      <textarea
        ref={textareaRef}
        className="editor-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type or paste markdown here, or drag & drop a .md file..."
        spellCheck="false"
      />
    </div>
  );
};
