import { useState } from 'react'
import { Search } from 'lucide-react'
import { useInvoice } from '../../context/InvoiceContext'
import ProductListItem from './ProductListItem'

export default function ProductSearch({ onSelect }) {
  const { products } = useInvoice()
  const [query, setQuery] = useState('')

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    (p.description ?? '').toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div>
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-2.5 py-2 bg-gray-50">
          <Search size={14} className="text-gray-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un produit ou service..."
            className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
          />
        </div>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-gray-400">Aucun résultat</div>
        ) : (
          filtered.map(p => <ProductListItem key={p.id} product={p} onSelect={onSelect} />)
        )}
      </div>
    </div>
  )
}
