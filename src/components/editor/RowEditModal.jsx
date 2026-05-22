import { useState, useEffect } from 'react'
import { useInvoice } from '../../context/InvoiceContext'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import RichTextEditor from './RichTextEditor'

export default function RowEditModal() {
  const { ui, invoice, closeRowEditModal, updateRow } = useInvoice()
  const { open, rowId } = ui.rowEditModal

  const originalRow = invoice.rows.find(r => r.id === rowId)

  const [local, setLocal] = useState(null)

  // Populate local copy when modal opens
  useEffect(() => {
    if (open && originalRow) {
      setLocal({ ...originalRow })
    }
  }, [open, rowId])

  function set(k, v) { setLocal(l => ({ ...l, [k]: v })) }

  function handleSave() {
    if (!local) return
    updateRow(rowId, local)
    closeRowEditModal()
  }

  const total = local ? (Number(local.qty) || 0) * (Number(local.unitPrice) || 0) : 0

  return (
    <Modal
      open={open}
      onClose={closeRowEditModal}
      title="Modifier la ligne"
      width="max-w-2xl"
    >
      {local && (
        <div className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input
                label="Désignation"
                value={local.name}
                onChange={(e) => set('name', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Description</label>
            <RichTextEditor
              initialHtml={local.descriptionHtml || local.description || ''}
              onChange={(html) => set('descriptionHtml', html)}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Quantité"
              type="number"
              min="0"
              step="0.01"
              value={local.qty}
              onChange={(e) => set('qty', e.target.value)}
            />
            <Input
              label="Prix unitaire (HT)"
              type="number"
              min="0"
              step="0.01"
              value={local.unitPrice}
              onChange={(e) => set('unitPrice', e.target.value)}
            />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Total HT</label>
              <div className="border border-gray-200 rounded px-2.5 py-1.5 text-sm font-semibold text-gray-800 bg-gray-50">
                {total.toLocaleString('fr-MA', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button variant="ghost" onClick={closeRowEditModal}>Annuler</Button>
            <Button onClick={handleSave}>Enregistrer</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
