import { useRef } from 'react';
import PropTypes from 'prop-types';
import { Braces, Circle } from 'lucide-react';

export function CodeEditor({ id, code, onChange, language, title = 'Repair the source', disabled = false, minHeight = 380, onSubmitLabel = null }) {
  const editorRef = useRef(null);
  const gutterRef = useRef(null);
  const lineCount = Math.max(1, code.split('\n').length);

  const handleKeyDown = (event) => {
    if (event.key !== 'Tab' || disabled) return;
    event.preventDefault();
    const textarea = event.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const nextCode = `${code.slice(0, start)}  ${code.slice(end)}`;
    onChange(nextCode);
    requestAnimationFrame(() => {
      if (editorRef.current) editorRef.current.setSelectionRange(start + 2, start + 2);
    });
  };

  return (
    <section className="comp-editor" aria-labelledby={`${id}-title`}>
      <div className="comp-editor__topbar">
        <div className="comp-editor__lights" aria-hidden="true"><Circle /><Circle /><Circle /></div>
        <div className="comp-editor__file"><Braces size={14} /><span id={`${id}-title`}>{title}</span></div>
        <span className="comp-editor__language">{language || 'source'}</span>
      </div>
      <div className="comp-editor__body" style={{ minHeight }}>
        <pre className="comp-editor__gutter" ref={gutterRef} aria-hidden="true">{Array.from({ length: lineCount }, (_, index) => index + 1).join('\n')}</pre>
        <textarea
          id={id}
          ref={editorRef}
          value={code}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={(event) => { if (gutterRef.current) gutterRef.current.scrollTop = event.currentTarget.scrollTop; }}
          maxLength={20000}
          spellCheck="false"
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          disabled={disabled}
          aria-label={`${language || 'Code'} source editor`}
          className="comp-editor__input"
          style={{ minHeight }}
        />
      </div>
      <div className="comp-editor__statusbar">
        <span>{lineCount} lines</span>
        <span>{Math.max(0, 20000 - code.length).toLocaleString()} characters left</span>
        {onSubmitLabel && <span className="comp-editor__hint">{onSubmitLabel}</span>}
      </div>
    </section>
  );
}

CodeEditor.propTypes = {
  id: PropTypes.string.isRequired,
  code: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  language: PropTypes.string,
  title: PropTypes.string,
  disabled: PropTypes.bool,
  minHeight: PropTypes.number,
  onSubmitLabel: PropTypes.string,
};

export default CodeEditor;
