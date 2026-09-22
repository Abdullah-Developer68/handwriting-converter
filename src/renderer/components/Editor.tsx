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
  FileDown
} from 'lucide-react';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  onDropFile: (file: File) => void;
  onCursorChange?: (pos: number) => void;
  onOpenImport?: () => void;
}

export const Editor: React.FC<EditorProps> = ({
  value,
  onChange,
  onDropFile,
  onCursorChange,
  onOpenImport,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const updateCursor = (target: HTMLTextAreaElement) => {
    onCursorChange?.(target.selectionStart);
  };

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
      const newPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newPos, newPos);
      onCursorChange?.(newPos);
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
        <div className="editor-toolbar-actions">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => insertTextAtCursor('**', '**', 'bold text')}
            title="Bold (**text**)"
          >
            <Bold size={13} />
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => insertTextAtCursor('*', '*', 'italic text')}
            title="Italic (*text*)"
          >
            <Italic size={13} />
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => insertTextAtCursor('==', '==', 'highlighted text')}
            title="Handwritten Highlighter (==text==)"
            style={{ color: '#facc15' }}
          >
            <Highlighter size={13} />
          </button>

          <div className="toolbar-divider" />

          <button
            className="btn btn-ghost btn-sm"
            onClick={() => insertTextAtCursor('# ', '', 'Heading 1')}
            title="Heading 1 (#)"
          >
            <Heading1 size={14} />
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => insertTextAtCursor('## ', '', 'Heading 2')}
            title="Heading 2 (##)"
          >
            <Heading2 size={14} />
          </button>

          <div className="toolbar-divider" />

          <button
            className="btn btn-ghost btn-sm"
            onClick={() => insertTextAtCursor('- ', '', 'List item')}
            title="Bullet list (- )"
          >
            <List size={13} />
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => insertTextAtCursor('- [ ] ', '', 'Task item')}
            title="Task list checkbox (- [ ])"
          >
            <CheckSquare size={13} />
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => insertTextAtCursor('> ', '', 'Quote text')}
            title="Blockquote (> )"
          >
            <Quote size={13} />
          </button>

          <div className="toolbar-divider" />

          <button
            className="btn btn-ghost btn-sm"
            onClick={() => insertTextAtCursor('\n| Column 1 | Column 2 |\n| :--- | :--- |\n| Item 1 | Item 2 |\n')}
            title="Insert Table"
          >
            <Table size={13} />
          </button>

          <button
            className="btn btn-ghost btn-sm"
            onClick={() => insertTextAtCursor('\n\n<!-- pagebreak -->\n\n')}
            title="Insert Page Break (starts a new handwritten sheet)"
            style={{ color: '#a78bfa' }}
          >
            <Scissors size={13} />
            <span className="editor-btn-label">Break</span>
          </button>

          <div className="toolbar-divider" />

          {/* Import Pages Button */}
          <button
            className="btn btn-ghost btn-sm btn-import-toolbar"
            onClick={onOpenImport}
            title="Import pages from PDF, Word / Google Docs (.docx)"
          >
            <FileDown size={13} />
            <span className="editor-btn-label">Import</span>
          </button>
        </div>

        {/* Drop Hint */}
        <div className="editor-drop-hint" title="Drag & drop PDF, Word (.docx) or Markdown files directly here">
          <FileUp size={12} style={{ flexShrink: 0 }} />
          <span className="editor-drop-text">Drop PDF / Docs / MD</span>
        </div>
      </div>

      {/* Main Markdown Textarea */}
      <textarea
        ref={textareaRef}
        className="editor-textarea"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          updateCursor(e.target);
        }}
        onClick={(e) => updateCursor(e.currentTarget)}
        onKeyUp={(e) => updateCursor(e.currentTarget)}
        onSelect={(e) => updateCursor(e.currentTarget)}
        placeholder="Type or paste markdown here, or drag & drop a PDF, Word docx or Markdown file..."
        spellCheck="false"
      />
    </div>
  );
};
