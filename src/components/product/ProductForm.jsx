import { useState } from 'react'
import { useInvoice } from '../../context/InvoiceContext'
import Input from '../ui/Input'
import Button from '../ui/Button'
import RichTextEditor from '../editor/RichTextEditor'

const empty = { name: '', descriptionHtml: '', unitPrice: '' }

function stripHtml(html) {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

export default function ProductForm({ onSave, onCancel }) {
  const { addProduct, addRow } = useInvoice()
  const [fields, setFields] = useState(empty)

  function set(k, v) { setFields(f => ({ ...f, [k]: v })) }

  function handleSave() {
    if (!fields.name.trim()) return
    const product = {
      name: fields.name,
      description: stripHtml(fields.descriptionHtml),
      descriptionHtml: fields.descriptionHtml,
      unitPrice: parseFloat(fields.unitPrice) || 0,
    }
    addProduct(product)
    addRow(product)
    onSave?.()
  }

  return (
    <div className="p-4 flex flex-col gap-3">
      <Input label="Nom du produit / service *" value={fields.name} onChange={(e) => set('name', e.target.value)} placeholder="Ex: Développement web" />
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">Description</label>
        <RichTextEditor
          initialHtml={fields.descriptionHtml}
          onChange={(html) => set('descriptionHtml', html)}
        />
      </div>
      <Input
        label="Prix unitaire (HT)"
        type="number"
        min="0"
        step="0.01"
        value={fields.unitPrice}
        onChange={(e) => set('unitPrice', e.target.value)}
        placeholder="0.00"
      />
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={onCancel}>Annuler</Button>
        <Button onClick={handleSave} disabled={!fields.name.trim()}>Ajouter</Button>
      </div>
    </div>
  )
}
