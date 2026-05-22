import { useInvoice } from '../../context/InvoiceContext'

export default function DiscountField() {
  const { invoice, setDiscountPercent } = useInvoice()
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-gray-500 whitespace-nowrap">Remise</label>
      <input
        type="number"
        min="0"
        max="100"
        step="0.1"
        value={invoice.discountPercent}
        onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
        className="w-16 border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
      />
      <span className="text-xs text-gray-500">%</span>
    </div>
  )
}
