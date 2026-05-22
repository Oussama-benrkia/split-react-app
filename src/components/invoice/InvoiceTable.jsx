import InvoiceRow from './InvoiceRow'
import ContinuedRowFragment from './ContinuedRowFragment'

const columns = [
  { label: '#', width: '4%' },
  { label: 'Désignation', width: '22%' },
  { label: 'Description', width: '38%' },
  { label: 'Qté', width: '8%' },
  { label: 'P.U.', width: '12%' },
  { label: 'Total', width: '12%' },
  { label: '', width: '4%' },
]

export default function InvoiceTable({ rows, showHeader, rowStartIndex = 0, onRowHeightChange }) {
  if (!rows || rows.length === 0) {
    return (
      <div>
        {showHeader && <TableHead />}
        <div className="py-8 text-center text-xs text-gray-400 italic border-b border-gray-200">
          Aucune ligne — ajoutez un produit ou service
        </div>
      </div>
    )
  }

  return (
    <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
      <colgroup>
        {columns.map((c, i) => <col key={i} style={{ width: c.width }} />)}
      </colgroup>
      {showHeader && <TableHead />}
      <tbody>
        {rows.map((row, index) =>
          row._isContinued ? (
            <ContinuedRowFragment key={row.id + '-cont'} row={row} index={rowStartIndex + index} />
          ) : (
            <InvoiceRow key={row.id} row={row} index={rowStartIndex + index} onHeightChange={onRowHeightChange} />
          )
        )}
      </tbody>
    </table>
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
