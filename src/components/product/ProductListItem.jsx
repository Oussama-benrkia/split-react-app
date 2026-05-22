function formatPrice(p) {
  return Number(p).toLocaleString('fr-MA', { minimumFractionDigits: 2 })
}

export default function ProductListItem({ product, onSelect }) {
  return (
    <div
      onClick={() => onSelect(product)}
      className="flex items-start justify-between gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-800 group-hover:text-blue-700 transition-colors">{product.name}</div>
        {product.description && (
          <div className="text-xs text-gray-500 mt-0.5 truncate">{product.description}</div>
        )}
      </div>
      <div className="text-sm font-semibold text-gray-700 whitespace-nowrap flex-shrink-0">
        {formatPrice(product.unitPrice)}
      </div>
    </div>
  )
}
