import { useInvoice } from '../../context/InvoiceContext'

export default function FooterConfigForm() {
  const { settings, updateSettings } = useInvoice()
  const f = settings.footer

  function set(col, val) {
    updateSettings('footer', { [col]: val })
  }

  const textareaClass = 'border border-gray-300 rounded px-2.5 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none w-full'

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-gray-500">Le pied de page est divisé en 3 colonnes affichées sur la dernière page.</p>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">Colonne gauche</label>
        <textarea rows={3} className={textareaClass} value={f.col1} onChange={(e) => set('col1', e.target.value)} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">Colonne centre</label>
        <textarea rows={3} className={textareaClass} value={f.col2} onChange={(e) => set('col2', e.target.value)} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">Colonne droite</label>
        <textarea rows={3} className={textareaClass} value={f.col3} onChange={(e) => set('col3', e.target.value)} />
      </div>
    </div>
  )
}
