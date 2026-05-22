import { Plus } from 'lucide-react'
import { useInvoice } from '../../context/InvoiceContext'

export default function AddProductButton() {
  const { openProductModal } = useInvoice()

  return (
    <div className="mt-2" data-print-hide>
      <button
        onClick={openProductModal}
        className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 border border-dashed border-blue-300 hover:border-blue-400 rounded-lg transition-colors cursor-pointer w-full justify-center"
      >
        <Plus size={15} />
        Ajouter un produit / service
      </button>
    </div>
  )
}
