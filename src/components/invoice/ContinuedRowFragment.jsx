export default function ContinuedRowFragment({ row, index }) {
  const hasContinuationText = row._continuationText !== undefined

  return (
    <tr className="border-b border-gray-100">
      <td className="py-2 px-3 text-xs text-gray-400 align-top">{index + 1}</td>
      <td className="py-2 px-3 text-xs text-gray-700 align-top font-medium text-gray-800">
        {row.name}
      </td>
      {hasContinuationText ? (
        <td className="py-2 px-3 text-xs text-gray-600 align-top"
          style={{ overflow: 'hidden', maxWidth: 0, wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}>
          {row._continuationText}
        </td>
      ) : (
        <td
          className="py-2 px-3 text-xs text-gray-600 align-top"
          style={{ overflow: 'hidden', maxWidth: 0, wordBreak: 'break-word', overflowWrap: 'break-word' }}
          dangerouslySetInnerHTML={{ __html: row.descriptionHtml || row.description || '' }}
        />
      )}
      <td />
      <td />
      <td />
      <td />
    </tr>
  )
}
