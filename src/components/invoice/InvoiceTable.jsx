import { useInvoice } from '../../context/InvoiceContext'
import InvoiceRow from './InvoiceRow'
import ContinuedRowFragment from './ContinuedRowFragment'
import ProbeRow from './ProbeRow'

const columns = [
  { label: '#', width: '4%' },
  { label: 'Désignation', width: '22%' },
  { label: 'Description', width: '38%' },
  { label: 'Qté', width: '8%' },
  { label: 'P.U.', width: '12%' },
  { label: 'Total', width: '12%' },
  { label: '', width: '4%' },
]

// A4 content width: 794px page − 40px×2 horizontal padding = 714px.
// The off-screen measurement table must match this exactly so its colgroup distributes
// identical pixel column widths to the visible table, giving identical text wrapping.
const MEASURE_TABLE_WIDTH = 714

export default function InvoiceTable({ rows, showHeader, rowStartIndex = 0, onRowHeightChange, isProbeHost, measureRowRef }) {
  const { invoice } = useInvoice()

  return (
    <>
      <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
        <colgroup>
          {columns.map((c, i) => <col key={i} style={{ width: c.width }} />)}
        </colgroup>
        {showHeader && <TableHead />}
        <tbody>
          {invoice.rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-8 text-center text-xs text-gray-400 italic border-b border-gray-200">
                Aucune ligne — ajoutez un produit ou service
              </td>
            </tr>
          ) : rows && rows.length > 0 ? (() => {
            let lastDisplayIndex = rowStartIndex - 1
            return rows.map((row) => {
              if (!row._isContinued) lastDisplayIndex++
              return row._isContinued ? (
                <ContinuedRowFragment key={row.id + '-cont'} row={row} index={lastDisplayIndex} onHeightChange={onRowHeightChange} />
              ) : (
                <InvoiceRow key={row.id} row={row} index={lastDisplayIndex} onHeightChange={onRowHeightChange} />
              )
            })
          })() : null}
        </tbody>
      </table>

      {/* Off-screen measurement host. A separate table fixed at MEASURE_TABLE_WIDTH with the
          same colgroup produces pixel-identical column widths to the visible table above.
          ProbeRows and the measurement row are plain in-flow <tr> elements — no height
          constraints — so offsetHeight returns their true natural height. The container's
          position:fixed top:-9999px removes any layout impact without affecting the rows'
          internal geometry. overflow:hidden on <tr> is excluded from the CSS spec and
          ignored by browsers, so we avoid it entirely here. */}
      {isProbeHost && (
        <div style={{ position: 'fixed', top: -9999, left: 0, width: MEASURE_TABLE_WIDTH, visibility: 'hidden', pointerEvents: 'none' }}>
          <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
            <colgroup>
              {columns.map((c, i) => <col key={i} style={{ width: c.width }} />)}
            </colgroup>
            <tbody>
              {invoice.rows.map(row => (
                <ProbeRow key={row.id + '__probe'} row={row} onHeight={onRowHeightChange} />
              ))}
              <tr ref={measureRowRef}>
                <td className="py-2 px-3 text-xs" />
                <td className="py-2 px-3 text-xs font-medium text-gray-800 align-top" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }} />
                <td className="rich-editor py-2 px-3 text-xs text-gray-600 align-top" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }} />
                <td className="py-2 px-3 text-xs" />
                <td className="py-2 px-3 text-xs" />
                <td className="py-2 px-3 text-xs" />
                <td className="py-2 px-3 text-xs" />
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function TableHead() {
  return (
    <thead>
      <tr className="border-b-2 border-gray-800">
        {columns.map((c, i) => (
          <th
            key={i}
            className={`py-2 px-3 text-xs font-bold text-gray-700 uppercase tracking-wide ${
              i === 0 ? 'text-left' :
              i === 1 ? 'text-left' :
              i === 2 ? 'text-left' :
              i === 3 ? 'text-center' :
              i === 4 ? 'text-right' :
              i === 5 ? 'text-right' : ''
            }`}
          >
            {c.label}
          </th>
        ))}
      </tr>
    </thead>
  )
}
