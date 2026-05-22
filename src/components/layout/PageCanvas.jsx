import { useRef, useEffect } from 'react'
import A4Page from './A4Page'
import ZoneClient from '../zones/ZoneClient'
import ZoneCompany from '../zones/ZoneCompany'
import ZoneInvoiceBody from '../zones/ZoneInvoiceBody'
import ZoneFooter from '../zones/ZoneFooter'
import TotalsBlock from '../totals/TotalsBlock'

// Description column inner width: table col width minus px-3 padding on each side.
const DESC_COL_INNER_W = 247

export default function PageCanvas({ pages, onRowHeightChange, onHeaderHeightChange, onTextMetricsChange }) {
  const headerRef = useRef(null)
  const probeRef = useRef(null)
  const probeSpanRef = useRef(null)
  const metricsRef = useRef(null)

  // Measure the header zone after every render so usePagination gets the real
  // height (logo + company info + invoice meta vary and can exceed the default estimate).
  // offsetHeight excludes margin, so we add mb-6 (1.5 rem = 24 px at root 16 px).
  useEffect(() => {
    if (headerRef.current) {
      onHeaderHeightChange?.(headerRef.current.offsetHeight + 24)
    }
  })

  // Measure actual text metrics once after mount.
  useEffect(() => {
    if (!probeRef.current || !probeSpanRef.current) return
    const style = getComputedStyle(probeRef.current)
    const lineHeight = parseFloat(style.lineHeight) || 16
    const sampleText = 'abcdefghijklmnopqrstuvwxyz abcdefghij' // 37 chars, varied width
    probeSpanRef.current.textContent = sampleText
    const avgCharWidth = probeSpanRef.current.offsetWidth / sampleText.length
    const charsPerLine = Math.floor(DESC_COL_INNER_W / avgCharWidth)
    const next = { lineHeight, charsPerLine }
    // Only fire if values actually changed to avoid infinite re-render loops.
    const prev = metricsRef.current
    if (!prev || prev.lineHeight !== next.lineHeight || prev.charsPerLine !== next.charsPerLine) {
      metricsRef.current = next
      onTextMetricsChange?.(next)
    }
  })

  return (
    <div className="flex flex-col items-center py-8 pt-20 min-h-screen bg-gray-200">
      {/* Hidden probe to measure real text-xs line-height and avg char width */}
      <div
        ref={probeRef}
        className="text-xs"
        style={{ position: 'fixed', top: -9999, left: -9999, visibility: 'hidden', whiteSpace: 'nowrap' }}
        aria-hidden="true"
      >
        <span ref={probeSpanRef} />
      </div>
      {pages.map((page, index) => (
        <A4Page key={index} pageNumber={index + 1} isLast={page.isLast}>
          {/* Content area — hard-clipped so rows never flow under the absolute footer.
              947 = (1123 - 48top - 48bottom) - 80(FOOTER_H), matching the pagination budget. */}
          <div style={{ height: 947, overflow: 'hidden' }}>
            {/* Zones 1 & 2 — every page */}
            <div
              ref={index === 0 ? headerRef : undefined}
              className="flex gap-4 mb-6"
              style={{ minHeight: 160 }}
            >
              <div className="w-[40%]">
                <ZoneClient readOnly={index !== 0} />
              </div>
              <div className="w-[60%]">
                <ZoneCompany readOnly={index !== 0} />
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
