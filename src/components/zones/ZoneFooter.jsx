import { useInvoice } from '../../context/InvoiceContext'

export default function ZoneFooter() {
  const { settings } = useInvoice()
  const f = settings.footer

  return (
    <div className="absolute bottom-12 left-10 right-10 pt-4 border-t border-gray-300">
      <div className="grid grid-cols-3 gap-4">
        {[f.col1, f.col2, f.col3].map((col, i) => (
          <div key={i} className={`text-xs text-gray-500 whitespace-pre-line ${i === 1 ? 'text-center' : i === 2 ? 'text-right' : ''}`}>
            {col}
          </div>
        ))}
      </div>
    </div>
  )
}
