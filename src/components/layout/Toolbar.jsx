import { useState } from 'react'
import { Settings, Download, FilePlus, Loader } from 'lucide-react'
import { useInvoice } from '../../context/InvoiceContext'
import { exportPdf } from '../../utils/exportPdf'

export default function Toolbar({ pageCount }) {
  const { openSettings, resetInvoice, invoice } = useInvoice()
  const [exporting, setExporting] = useState(false)

  function handleNewInvoice() {
    if (window.confirm('Créer une nouvelle facture ? Les données actuelles seront sauvegardées.')) {
      resetInvoice()
    }
  }

  async function handleExport() {
    if (exporting) return
    setExporting(true)
    try {
      const name = invoice?.number ? `facture-${invoice.number}.pdf` : 'facture.pdf'
      await exportPdf(name)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 flex items-center justify-between px-6 py-2.5 shadow-sm"
      data-print-hide
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-blue-600 tracking-wide">Invoice Studio</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 mr-2">{pageCount} page{pageCount > 1 ? 's' : ''}</span>
        <button
          onClick={handleNewInvoice}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors cursor-pointer"
          title="Nouvelle facture"
        >
          <FilePlus size={16} />
          <span className="hidden sm:inline">Nouvelle</span>
        </button>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          title="Télécharger PDF"
        >
          {exporting
            ? <Loader size={16} className="animate-spin" />
            : <Download size={16} />}
          <span className="hidden sm:inline">{exporting ? 'Export...' : 'PDF'}</span>
        </button>
        <button
          onClick={openSettings}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors cursor-pointer"
          title="Paramètres"
        >
          <Settings size={16} />
          <span className="hidden sm:inline">Paramètres</span>
        </button>
      </div>
    </div>
  )
}
