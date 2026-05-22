import { useInvoice } from '../../context/InvoiceContext'
import Input from '../ui/Input'
import LogoUploader from './LogoUploader'

export default function CompanyInfoForm() {
  const { settings, updateSettings } = useInvoice()
  const c = settings.company

  function set(field, val) {
    updateSettings('company', { [field]: val })
  }

  return (
    <div className="flex flex-col gap-4">
      <LogoUploader logo={c.logo} onChange={(val) => set('logo', val)} />
      <Input label="Nom de l'entreprise" value={c.name} onChange={(e) => set('name', e.target.value)} />
      <Input label="Adresse" value={c.address} onChange={(e) => set('address', e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Téléphone" value={c.phone} onChange={(e) => set('phone', e.target.value)} />
        <Input label="Email" value={c.email} onChange={(e) => set('email', e.target.value)} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Input label="RC" value={c.rc} onChange={(e) => set('rc', e.target.value)} />
        <Input label="IF" value={c.if_} onChange={(e) => set('if_', e.target.value)} />
        <Input label="ICE" value={c.ice} onChange={(e) => set('ice', e.target.value)} />
      </div>
    </div>
  )
}
