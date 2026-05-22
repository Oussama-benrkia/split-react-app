import { sanitizeRichHtml } from '../../utils/sanitizeRichHtml'

export default function ContinuedRowFragment({ row, index }) {
  const skip = row._splitDescHeight || 0

  return (
    <tr className="border-b border-gray-100">
      <td className="py-2 px-3 text-xs text-gray-400 align-top">{index + 1}</td>
      <td className="py-2 px-3 text-xs text-gray-700 align-top font-medium text-gray-800">
        {row.name}
      </td>
      {/* Slide the full rich HTML upward by the height already shown on the previous page.
          Items scrolled off the top stay in the DOM, so <ol> counters remain continuous. */}
      <td
        className="rich-editor py-2 px-3 text-xs text-gray-600 align-top"
        style={{ overflow: 'hidden', maxWidth: 0 }}
      >
        <div
          style={{
            transform: `translateY(-${skip}px)`,
            marginBottom: `-${skip}px`,
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
          }}
          dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(row.descriptionHtml || row.description || '') }}
        />
      </td>
      <td />
      <td />
      <td />
      <td />
    </tr>
  )
}
