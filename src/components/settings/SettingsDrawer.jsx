import { useState } from 'react'
import { X, Building2, FileText, AlignJustify } from 'lucide-react'
import { useInvoice } from '../../context/InvoiceContext'
import CompanyInfoForm from './CompanyInfoForm'
import InvoiceDefaultsForm from './InvoiceDefaultsForm'
import FooterConfigForm from './FooterConfigForm'

const tabs = [
  { id: 'company', label: 'Entreprise', icon: Building2 },
  { id: 'defaults', label: 'Facture', icon: FileText },
  { id: 'footer', label: 'Pied de page', icon: AlignJustify },
]

export default function SettingsDrawer() {
  const { ui, closeSettings } = useInvoice()
  const [activeTab, setActiveTab] = useState('company')

  return (
    <>
      {/* Backdrop */}
      {ui.settingsOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={closeSettings}
          data-print-hide
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full z-50 bg-white shadow-2xl flex flex-col transition-transform duration-300 ${ui.settingsOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ width: 380 }}
        data-print-hide
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-800">Paramètres</h2>
          <button onClick={closeSettings} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 flex-shrink-0">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'company' && <CompanyInfoForm />}
          {activeTab === 'defaults' && <InvoiceDefaultsForm />}
          {activeTab === 'footer' && <FooterConfigForm />}
        </div>
      </div>
    </>
  )
}
