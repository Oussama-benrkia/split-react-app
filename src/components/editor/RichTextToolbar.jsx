import { Bold, Italic, Underline, List, ListOrdered } from 'lucide-react'
import ColorPalette from './ColorPalette'
import FontSizePicker from './FontSizePicker'

export default function RichTextToolbar({ editorRef, onInput }) {
  function exec(cmd, val = null) {
    editorRef.current?.focus()
    document.execCommand(cmd, false, val)
    onInput?.()
  }

  function applyFontSize(px) {
    editorRef.current?.focus()
    document.execCommand('fontSize', false, '7')
    const fonts = editorRef.current?.querySelectorAll('font[size="7"]') ?? []
    fonts.forEach(font => {
      const span = document.createElement('span')
      span.style.fontSize = px + 'px'
      span.innerHTML = font.innerHTML
      font.replaceWith(span)
    })
    onInput?.()
  }

  function applyColor(hex) {
    editorRef.current?.focus()
    // styleWithCSS makes foreColor produce <span style="color:..."> (inline style,
    // specificity 1,0,0,0) instead of <font color="..."> (presentational hint,
    // specificity 0) which would be overridden by any Tailwind color class.
    document.execCommand('styleWithCSS', false, true)
    document.execCommand('foreColor', false, hex)
    onInput?.()
  }

  const btnClass = 'p-1.5 rounded text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors cursor-pointer'

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 border-b border-gray-200 bg-gray-50 flex-wrap">
      <button onMouseDown={(e) => { e.preventDefault(); exec('bold') }} className={btnClass} title="Gras (Ctrl+B)">
        <Bold size={14} />
      </button>
      <button onMouseDown={(e) => { e.preventDefault(); exec('italic') }} className={btnClass} title="Italique (Ctrl+I)">
        <Italic size={14} />
      </button>
      <button onMouseDown={(e) => { e.preventDefault(); exec('underline') }} className={btnClass} title="Souligner (Ctrl+U)">
        <Underline size={14} />
      </button>
      <div className="w-px h-4 bg-gray-300 mx-1" />
      <button onMouseDown={(e) => { e.preventDefault(); exec('insertUnorderedList') }} className={btnClass} title="Liste à puces">
        <List size={14} />
      </button>
      <button onMouseDown={(e) => { e.preventDefault(); exec('insertOrderedList') }} className={btnClass} title="Liste numérotée">
        <ListOrdered size={14} />
      </button>
      <div className="w-px h-4 bg-gray-300 mx-1" />
      <FontSizePicker onSize={applyFontSize} />
      <div className="w-px h-4 bg-gray-300 mx-1" />
      <ColorPalette onColor={applyColor} />
    </div>
  )
}
