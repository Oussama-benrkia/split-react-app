import { useInvoice } from '../../context/InvoiceContext'
import Input from '../ui/Input'

export default function InvoiceDefaultsForm() {
  const { settings, updateSettings } = useInvoice()
  const d = settings.defaults

  function set(field, val) {
    updateSettings('defaults', { [field]: val })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Préfixe de facture"
          value={d.invoiceNumberPrefix}
          onChange={(e) => set('invoiceNumberPrefix', e.target.value)}
        />
        <Input
          label="Prochain N°"
          type="number"
          min="1"
          value={d.nextInvoiceNumber}
          onChange={(e) => set('nextInvoiceNumber', parseInt(e.target.value) || 1)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">TVA par défaut</label>
        <select
          value={d.tvaRate}
          onChange={(e) => set('tvaRate', Number(e.target.value))}
          className="border border-gray-300 rounded px-2.5 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {[0, 7, 10, 14, 20].map(r => <option key={r} value={r}>{r}%</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">Devise</label>
        <select
          value={d.currency}
          onChange={(e) => set('currency', e.target.value)}
          className="border border-gray-300 rounded px-2.5 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {['MAD', 'EUR', 'USD'].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">Libellé de facture</label>
        <select
          value={d.labelText}
          onChange={(e) => set('labelText', e.target.value)}
          className="border border-gray-300 rounded px-2.5 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="FACTURE">FACTURE</option>
          <option value="INVOICE">INVOICE</option>
          <option value="DEVIS">DEVIS</option>
        </select>
      </div>
      <Input
        label="Délai de paiement (jours)"
        type="number"
        min="0"
        value={d.paymentTermsDays}
        onChange={(e) => set('paymentTermsDays', parseInt(e.target.value) || 30)}
      />
    </div>
  )
}
