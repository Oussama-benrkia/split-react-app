import { useRef } from 'react'
import { useInvoice } from '../../context/InvoiceContext'
import ClientInfo from '../client/ClientInfo'
import ClientDropdown from '../client/ClientDropdown'

export default function ZoneClient({ readOnly = false }) {
  const { invoice, openClientDropdown } = useInvoice()
  const anchorRef = useRef(null)

  return (
    <div className="relative" ref={anchorRef}>
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Facturé à</div>
      <ClientInfo
        client={invoice.selectedClient}
        onClick={readOnly ? undefined : openClientDropdown}
        readOnly={readOnly}
      />
      {!readOnly && <ClientDropdown anchorRef={anchorRef} />}
    </div>
  )
}
