import { useInvoice } from '../../context/InvoiceContext'

export default function ZoneCompany({ readOnly = false }) {
  const { settings, invoice, setInvoiceDate, setInvoiceDueDate } = useInvoice()
  const c = settings.company

  return (
    <div className="flex flex-col items-end text-right">
      {/* Logo */}
      {c.logo ? (
        <img src={c.logo} alt="logo" className="h-14 w-auto object-contain mb-3" />
      ) : (
        <div className="h-14 w-32 bg-gray-100 rounded flex items-center justify-center mb-3">
          <span className="text-xs text-gray-400">Logo</span>
        </div>
      )}

      {/* Company info */}
      <div className="text-sm font-bold text-gray-800">{c.name}</div>
      <div className="text-xs text-gray-500 mt-0.5">{c.address}</div>
      <div className="text-xs text-gray-500">{c.phone}</div>
      <div className="text-xs text-gray-500">{c.email}</div>
      <div className="text-xs text-gray-400 mt-1">
        {c.rc} &nbsp;|&nbsp; {c.if_} &nbsp;|&nbsp; {c.ice}
      </div>

      {/* Invoice meta */}
      <div className="mt-4 flex flex-col items-end gap-1.5">
        <div className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
          N° {invoice.number}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span className="font-medium">Date :</span>
          {readOnly ? (
            <span className="text-xs text-gray-700">{invoice.date}</span>
          ) : (
            <input
              type="date"
              value={invoice.date}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="border-0 text-xs text-gray-700 bg-transparent focus:outline-none cursor-pointer"
            />
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span className="font-medium">Échéance :</span>
          {readOnly ? (
            <span className="text-xs text-gray-700">{invoice.dueDate}</span>
          ) : (
            <input
              type="date"
              value={invoice.dueDate}
              onChange={(e) => setInvoiceDueDate(e.target.value)}
              className="border-0 text-xs text-gray-700 bg-transparent focus:outline-none cursor-pointer"
            />
          )}
        </div>
      </div>
    </div>
  )
}
