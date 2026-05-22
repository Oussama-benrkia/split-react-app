import { useRef, useEffect } from 'react'
import RichTextToolbar from './RichTextToolbar'
import { sanitizeRichHtml } from '../../utils/sanitizeRichHtml'

export default function RichTextEditor({ initialHtml, onChange }) {
  const editorRef = useRef(null)

  // Set initial content once on mount only
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = sanitizeRichHtml(initialHtml)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleInput() {
    onChange?.(editorRef.current?.innerHTML ?? '')
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <RichTextToolbar editorRef={editorRef} onInput={handleInput} />
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        className="rich-editor min-h-32 px-3 py-2.5 text-sm text-gray-700 focus:outline-none"
        style={{ lineHeight: 1.6 }}
      />
    </div>
  )
}
