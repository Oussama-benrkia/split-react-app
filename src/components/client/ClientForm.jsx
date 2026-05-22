import { useState } from 'react'
import { useInvoice } from '../../context/InvoiceContext'
import Input from '../ui/Input'
import Button from '../ui/Button'

const empty = { name: '', company: '', address: '', email: '', phone: '', taxId: '' }

export default function ClientForm({ onSave, onCancel }) {
  const { addClient } = useInvoice()
  const [fields, setFields] = useState(empty)

  function set(k, v) { setFields(f => ({ ...f, [k]: v })) }

  function handleSave() {
    if (!fields.name.trim()) return
    addClient(fields, true) // andSelect=true
    onSave?.()
  }

  return (
    <div className="p-4 border-t border-gray-100 flex flex-col gap-3">
      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Nouveau client</p>
      <div className="grid grid-cols-2 gap-2">
        <Input label="Nom *" value={fields.name} onChange={(e) => set('name', e.target.value)} placeholder="Nom complet" />
        <Input label="Entreprise" value={fields.company} onChange={(e) => set('company', e.target.value)} placeholder="Société" />
      </div>
      <Input label="Adresse" value={fields.address} onChange={(e) => set('address', e.target.value)} placeholder="Adresse complète" />
      <div className="grid grid-cols-2 gap-2">
        <Input label="Email" type="email" value={fields.email} onChange={(e) => set('email', e.target.value)} />
        <Input label="Téléphone" value={fields.phone} onChange={(e) => set('phone', e.target.value)} />
      </div>
      <Input label="ICE / Identifiant fiscal" value={fields.taxId} onChange={(e) => set('taxId', e.target.value)} />
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={onCancel}>Annuler</Button>
        <Button onClick={handleSave} disabled={!fields.name.trim()}>Enregistrer</Button>
      </div>
    </div>
  )
}
