import { useState } from 'react'
import { MoreVertical, Pencil, Copy, Trash2, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useInvoice } from '../../context/InvoiceContext'

function RowActionModal({ open, onClose, onEdit, onDuplicate, onRemove }) {
  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.currentTarget === e.target) onClose() }}
      data-print-hide
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xs mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">Que souhaitez-vous faire ?</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="p-3 flex flex-col gap-1">
          <button
            onClick={onEdit}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer text-left"
          >
            <Pencil size={15} className="text-blue-500 shrink-0" />
            <span className="font-medium">Modifier la ligne</span>
          </button>

          <button
            onClick={onDuplicate}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer text-left"
          >
            <Copy size={15} className="text-gray-500 shrink-0" />
            <span className="font-medium">Dupliquer la ligne</span>
          </button>

          <button
            onClick={onRemove}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left"
          >
            <Trash2 size={15} className="shrink-0" />
            <span className="font-medium">Supprimer la ligne</span>
          </button>

          <div className="border-t border-gray-100 mt-1 pt-1">
            <button
              onClick={onClose}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm text-gray-400 hover:bg-gray-50 transition-colors cursor-pointer text-left"
            >
              <X size={15} className="shrink-0" />
              <span>Annuler</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default function InvoiceRowActions({ rowId, onRemoveStart }) {
  const { openRowEditModal, duplicateRow, removeRow } = useInvoice()
  const [open, setOpen] = useState(false)

  function handleOpen(e) {
    e.stopPropagation()
    setOpen(true)
  }

  function handleEdit() {
    setOpen(false)
    openRowEditModal(rowId)
  }

  function handleDuplicate() {
    setOpen(false)
    duplicateRow(rowId)
  }

  function handleRemove() {
    setOpen(false)
    onRemoveStart()
    setTimeout(() => removeRow(rowId), 500)
  }

  return (
    <>
      <div className="flex items-start justify-center pt-1" data-print-hide>
        <button
          onClick={handleOpen}
          title="Actions"
          className="p-1 rounded bg-gray-200 text-gray-500 hover:bg-gray-300 hover:text-gray-700 transition-colors cursor-pointer"
        >
          <MoreVertical size={13} />
        </button>
      </div>

      <RowActionModal
        open={open}
        onClose={() => setOpen(false)}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onRemove={handleRemove}
      />
    </>
  )
}
