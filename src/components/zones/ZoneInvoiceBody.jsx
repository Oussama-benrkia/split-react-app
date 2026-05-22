import { useRef } from 'react'
import { useInvoice } from '../../context/InvoiceContext'
import InvoiceTable from '../invoice/InvoiceTable'
import AddProductButton from '../invoice/AddProductButton'

export default function ZoneInvoiceBody({ pageRows, isFirstPage, isLastPage, pageIndex, rowStartIndex, onRowHeightChange }) {
  const { invoice, setLabelText } = useInvoice()
  const labelRef = useRef(null)

  function handleLabelBlur() {
    if (labelRef.current) setLabelText(labelRef.current.innerText.trim() || 'FACTURE')
  }

  return (
    <div>
      {/* Label — editable on first page, display-only on continuation pages */}
      <div className="mb-4">
        {isFirstPage ? (
          <div
            ref={labelRef}
            contentEditable
            suppressContentEditableWarning
            onBlur={handleLabelBlur}
            className="text-xl font-bold text-gray-800 tracking-widest uppercase inline-block border-b-2 border-transparent focus:border-blue-400 px-1 transition-colors"
            style={{ minWidth: 80 }}
          >
            {invoice.labelText}
          </div>
        ) : (
          <div className="text-xl font-bold text-gray-800 tracking-widest uppercase px-1">
            {invoice.labelText}
          </div>
        )}
      </div>

      {/* Table */}
      <InvoiceTable rows={pageRows} showHeader rowStartIndex={rowStartIndex} onRowHeightChange={onRowHeightChange} />

      {/* Add button always after last row on last page of rows */}
      {isLastPage && <AddProductButton />}
    </div>
  )
}
