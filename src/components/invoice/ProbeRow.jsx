import { useRef, useLayoutEffect } from 'react'
import { sanitizeRichHtml } from '../../utils/sanitizeRichHtml'

export default function ProbeRow({ row, onHeight }) {
  const rowRef = useRef(null)

  useLayoutEffect(() => {
    if (rowRef.current && onHeight) {
      onHeight(row.id, rowRef.current.offsetHeight)
    }
  }, [row.id, row.nameHtml, row.name, row.descriptionHtml, onHeight])

  return (
    <tr ref={rowRef}>
      <td className="py-2 px-3 text-xs" style={{ width: '4%' }} />
      <td
        className="py-2 px-3 text-xs font-medium text-gray-800 align-top"
        style={{ width: '22%', wordBreak: 'break-word', overflowWrap: 'anywhere' }}
        dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(row.nameHtml || row.name || '') }}
      />
      <td
        className="rich-editor py-2 px-3 text-xs text-gray-600 align-top"
        style={{ width: '38%', wordBreak: 'break-word', overflowWrap: 'anywhere' }}
        dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(row.descriptionHtml || row.description || '') }}
      />
      <td className="py-2 px-3 text-xs" style={{ width: '8%' }} />
      <td className="py-2 px-3 text-xs" style={{ width: '12%' }} />
      <td className="py-2 px-3 text-xs" style={{ width: '12%' }} />
      <td className="py-2 px-3 text-xs" style={{ width: '4%' }} />
    </tr>
  )
}
