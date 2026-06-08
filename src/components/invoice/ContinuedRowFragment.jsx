import { useRef, useLayoutEffect } from 'react'
import { sanitizeRichHtml } from '../../utils/sanitizeRichHtml'

export default function ContinuedRowFragment({ row, index, onHeightChange }) {
  const rowRef = useRef(null)
  const descStyle = { wordBreak: 'break-word', overflowWrap: 'anywhere' }

  // Report actual rendered height so the pagination engine can self-correct.
  // Skip _isFirstPart rows: their budget contribution is fixed (_splitHeight),
  // and offsetHeight would return the full unclipped height, corrupting the cache.
  useLayoutEffect(() => {
    if (rowRef.current && onHeightChange && !row._isFirstPart) {
      const key = (row._textSplit || row._htmlSplit)
        ? (row._partIndex !== undefined ? row.id + '_part_' + row._partIndex : row.id + '_c')
        : row.id
      onHeightChange(key, rowRef.current.offsetHeight)
    }
  }, [row.id, row._partIndex, row.descriptionHtml, row._isFirstPart, row._textSplit, row._htmlSplit, onHeightChange])

  return (
    <tr ref={rowRef} className="border-b border-gray-100">
      <td className="py-2 px-3 text-xs text-gray-400 align-top">{index + 1}</td>
      <td
        className="py-2 px-3 text-xs text-gray-700 align-top font-medium text-gray-800"
        dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(row.nameHtml || row.name || '') }}
      />
      <td
        className="rich-editor py-2 px-3 text-xs text-gray-600 align-top"
        style={{ overflow: 'hidden' }}
      >
        <div
          className="rich-editor text-gray-600"
          style={descStyle}
          dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(row.descriptionHtml || '') }}
        />
      </td>
      <td />
      <td />
      <td />
      <td />
    </tr>
  )
}
