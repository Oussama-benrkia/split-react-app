import { useInvoice } from '../../context/InvoiceContext'
import TVASelector from './TVASelector'
import DiscountField from './DiscountField'
import AmountInWords from './AmountInWords'

function fmt(n) {
  return Number(n).toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function TotalsBlock() {
  const { invoice } = useInvoice()

  const subtotal = invoice.rows.reduce((sum, r) => sum + (Number(r.qty) || 0) * (Number(r.unitPrice) || 0), 0)
  const discountAmt = subtotal * (invoice.discountPercent / 100)
  const subtotalAfterDiscount = subtotal - discountAmt
  const tvaAmt = subtotalAfterDiscount * (invoice.tvaRate / 100)
  const total = subtotalAfterDiscount + tvaAmt

  const currency = invoice.currency || 'MAD'

  return (
    <div className="flex flex-col items-end">
      <div className="w-72">
        {/* Subtotal */}
        <div className="flex justify-between items-center py-1.5 text-sm text-gray-700">
          <span>Sous-total HT</span>
          <span className="font-medium">{fmt(subtotal)} {currency}</span>
        </div>

        {/* Discount */}
        {invoice.discountPercent > 0 && (
          <div className="flex justify-between items-center py-1.5 text-sm text-gray-600">
            <span>Remise ({invoice.discountPercent}%)</span>
            <span className="text-red-600">- {fmt(discountAmt)} {currency}</span>
          </div>
        )}

        {/* TVA row */}
        <div className="flex justify-between items-center py-1.5 border-t border-gray-100">
          <TVASelector />
          <span className="text-sm text-gray-700">{fmt(tvaAmt)} {currency}</span>
        </div>

        {/* Discount input row */}
        <div className="flex justify-end py-1.5">
          <DiscountField />
        </div>

        {/* Total TTC */}
        <div className="flex justify-between items-center py-2 mt-1 border-t-2 border-gray-800">
          <span className="text-base font-bold text-gray-800">Total TTC</span>
          <span className="text-lg font-bold text-gray-900">{fmt(total)} {currency}</span>
        </div>

        <AmountInWords amount={total} />
      </div>
    </div>
  )
}
