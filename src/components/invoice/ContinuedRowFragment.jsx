import { useRef, useEffect } from 'react'
import { sanitizeRichHtml } from '../../utils/sanitizeRichHtml'

export default function ContinuedRowFragment({ row, index, onHeightChange }) {
  const rowRef = useRef(null)
  const skip = row._splitDescHeight || 0
  const descStyle = { wordBreak: 'break-word', overflowWrap: 'anywhere' }

  // Report actual rendered height so the pagination engine can self-correct.
  // Skip _isFirstPart rows: their budget contribution is fixed (_splitHeight),
  // and offsetHeight would return the full unclipped height, corrupting the cache.
  useEffect(() => {
    if (rowRef.current && onHeightChange && !row._isFirstPart) {
      const key = (row._textSplit || row._htmlSplit) // FIX 4: use _part_N when available, fall back to _c
        ? (row._partIndex !== undefined ? row.id + '_part_' + row._partIndex : row.id + '_c') // FIX 4
        : row.id
      onHeightChange(key, rowRef.current.offsetHeight)
    }
  })

  return (
    <tr ref={rowRef} className="border-b border-gray-100">
      <td className="py-2 px-3 text-xs text-gray-400 align-top">{index + 1}</td>
      <td className="py-2 px-3 text-xs text-gray-700 align-top font-medium text-gray-800">
        {row.name}
      </td>
      <td
        className="rich-editor py-2 px-3 text-xs text-gray-600 align-top"
        style={{ overflow: 'hidden' }}
      >
        {(row._textSplit || row._htmlSplit) ? (
          // Text/list split: descriptionHtml already contains only the continuation content.
          // _isFirstPart re-splits also land here; apply maxHeight so they don't overflow the page.
          <div
            className="rich-editor text-gray-600"
            style={{
              ...descStyle,
              ...(row._isFirstPart && row._splitDescHeight
                ? { maxHeight: row._splitDescHeight, overflow: 'hidden' }
                : {}),
            }}
            dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(row.descriptionHtml || '') }}
          />
        ) : (
          // Plain split: slide the full HTML up so visible content resumes at the right offset.
          <div
            className="rich-editor text-gray-600"
            style={{ ...descStyle, transform: `translateY(-${skip}px)`, marginBottom: `-${skip}px` }}
            dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(row.descriptionHtml || row.description || '') }}
          />
        )}
      </td>
      <td />
      <td />
      <td />
      <td />
    </tr>
  )
}
