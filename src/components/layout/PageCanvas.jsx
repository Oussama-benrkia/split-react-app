import A4Page from './A4Page'
import ZoneClient from '../zones/ZoneClient'
import ZoneCompany from '../zones/ZoneCompany'
import ZoneInvoiceBody from '../zones/ZoneInvoiceBody'
import ZoneFooter from '../zones/ZoneFooter'
import TotalsBlock from '../totals/TotalsBlock'

export default function PageCanvas({ pages, onRowHeightChange }) {
  return (
    <div className="flex flex-col items-center py-8 pt-20 min-h-screen bg-gray-200">
      {pages.map((page, index) => (
        <A4Page key={index} pageNumber={index + 1} isLast={page.isLast}>
          {/* Content area — hard-clipped so rows never flow under the absolute footer.
              947 = (1123 - 48top - 48bottom) - 80(FOOTER_H), matching the pagination budget. */}
          <div style={{ height: 947, overflow: 'hidden' }}>
            {/* Zones 1 & 2 — every page */}
            <div className="flex gap-4 mb-6" style={{ minHeight: 160 }}>
              <div className="w-[40%]">
                <ZoneClient />
              </div>
              <div className="w-[60%]">
                <ZoneCompany />
              </div>
            </div>

            {/* Zone 3 — Invoice body */}
            <ZoneInvoiceBody
              pageRows={page.rows}
              isFirstPage={index === 0}
              isLastPage={page.isLast}
              pageIndex={index}
              rowStartIndex={page.rowStartIndex}
              onRowHeightChange={onRowHeightChange}
            />

            {/* Zone 4 — Totals (last page only) */}
            {page.isLast && (
              <div className="mt-6">
                <TotalsBlock />
              </div>
            )}
          </div>

          {/* Footer — every page, pinned to bottom */}
          <ZoneFooter />
        </A4Page>
      ))}
    </div>
  )
}
