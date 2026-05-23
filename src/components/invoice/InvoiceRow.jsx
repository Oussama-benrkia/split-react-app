import { useState, useRef, useEffect } from 'react'
import { useInvoice } from '../../context/InvoiceContext'
import InvoiceRowActions from './InvoiceRowActions'
import { sanitizeRichHtml } from '../../utils/sanitizeRichHtml'

function formatCurrency(val) {
  return Number(val || 0).toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function InvoiceRow({ row, index, onHeightChange }) {
  const { updateRow } = useInvoice()
  const [removing, setRemoving] = useState(false)
  const rowRef = useRef(null)
  const nameRef = useRef(null)

  useEffect(() => {
    if (nameRef.current) {
      nameRef.current.innerHTML = sanitizeRichHtml(row.nameHtml || row.name || '')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const total = (Number(row.qty) || 0) * (Number(row.unitPrice) || 0)

  // Notify pagination about height changes.
  // Skip for _isFirstPart rows: their budget contribution is fixed (_splitHeight),
  // and offsetHeight would return the full unclipped row height, corrupting the cache.
  useEffect(() => {
    if (rowRef.current && onHeightChange && !row._isFirstPart) {
      onHeightChange(row.id, rowRef.current.offsetHeight)
    }
  })

  const cellBase = 'py-2 px-3 text-xs text-gray-700 align-top'

  return (
    <tr
      ref={rowRef}
      className={`border-b border-gray-100 group transition-colors ${removing ? 'bg-red-50 opacity-60' : 'hover:bg-gray-50/60'}`}
    >
      {/* # */}
      <td className={`${cellBase} text-gray-400 w-8`}>{index + 1}</td>

      {/* Name */}
      <td className={cellBase}>
        <div
          ref={nameRef}
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => updateRow(row.id, { name: e.currentTarget.innerText, nameHtml: e.currentTarget.innerHTML })}
          className="font-medium text-gray-800 focus:outline-none"
        />
      </td>

      {/* Description — read-only; edit via the ⋮ modal */}
      <td className={cellBase} style={{ overflow: 'hidden' }}>
        <div
          className="rich-editor text-gray-600"
          style={{
            wordBreak: 'break-word',
            overflowWrap: 'anywhere',
            ...(row._isFirstPart && { maxHeight: row._splitDescHeight, overflow: 'hidden' }),
          }}
          dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(row.descriptionHtml || row.description || '') }}
        />
      </td>

      {/* Qty */}
      <td className={`${cellBase} text-center`}>
        <input
          type="number"
          min="0"
          step="0.01"
          value={row.qty}
          onChange={(e) => updateRow(row.id, { qty: e.target.value })}
          className="w-16 text-center border-0 bg-transparent focus:outline-none focus:bg-blue-50 rounded px-1 text-xs"
        />
      </td>

      {/* Unit Price */}
      <td className={`${cellBase} text-right`}>
        <input
          type="number"
          min="0"
          step="0.01"
          value={row.unitPrice}
          onChange={(e) => updateRow(row.id, { unitPrice: e.target.value })}
          className="w-20 text-right border-0 bg-transparent focus:outline-none focus:bg-blue-50 rounded px-1 text-xs"
        />
      </td>

      {/* Total */}
      <td className={`${cellBase} text-right font-semibold text-gray-800 whitespace-nowrap`}>
        {formatCurrency(total)}
      </td>

      {/* Actions */}
      <td className="py-2 px-1 align-top w-12">
        <InvoiceRowActions rowId={row.id} onRemoveStart={() => setRemoving(true)} />
      </td>
    </tr>
  )
}
