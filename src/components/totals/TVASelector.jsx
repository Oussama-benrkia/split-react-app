import { useInvoice } from '../../context/InvoiceContext'

export default function TVASelector() {
  const { invoice, setTvaRate } = useInvoice()
  return (
    <select
      value={invoice.tvaRate}
      onChange={(e) => setTvaRate(Number(e.target.value))}
      className="border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
    >
      {[0, 7, 10, 14, 20].map(r => <option key={r} value={r}>TVA {r}%</option>)}
    </select>
  )
}
