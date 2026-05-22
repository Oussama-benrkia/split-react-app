import { useState } from 'react'
import { useInvoice } from '../../context/InvoiceContext'
import Modal from '../ui/Modal'
import ProductSearch from './ProductSearch'
import ProductForm from './ProductForm'

export default function ProductModal() {
  const { ui, closeProductModal, addRow } = useInvoice()
  const [tab, setTab] = useState('existing')

  function handleSelectExisting(product) {
    addRow(product)
    closeProductModal()
    setTab('existing')
  }

  function handleFormSave() {
    closeProductModal()
    setTab('existing')
  }

  return (
    <Modal
      open={ui.productModalOpen}
      onClose={() => { closeProductModal(); setTab('existing') }}
      title="Ajouter un produit / service"
      width="max-w-2xl"
    >
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'existing', label: 'Catalogue' },
          { id: 'new', label: 'Nouveau' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
              tab === t.id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'existing' ? (
        <ProductSearch onSelect={handleSelectExisting} />
      ) : (
        <ProductForm onSave={handleFormSave} onCancel={() => setTab('existing')} />
      )}
    </Modal>
  )
}
