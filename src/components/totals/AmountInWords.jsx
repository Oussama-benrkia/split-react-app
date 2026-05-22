import { numberToFrenchWords } from '../../utils/numberToWords'
import { useInvoice } from '../../context/InvoiceContext'

export default function AmountInWords({ amount }) {
  const { invoice } = useInvoice()
  const words = numberToFrenchWords(amount, invoice.currency)
  if (!words) return null
  return (
    <div className="mt-3 pt-3 border-t border-gray-200">
      <div className="text-xs text-gray-500">
        <span className="font-medium">Arrêté la présente facture à la somme de : </span>
        <span className="italic">{words}</span>
      </div>
    </div>
  )
}
