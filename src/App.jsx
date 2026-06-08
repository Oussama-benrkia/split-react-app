import { useState, useCallback, useRef, useDeferredValue } from 'react'
import { InvoiceProvider, useInvoice } from './context/InvoiceContext'
import { usePagination, HEADER_ZONE_H } from './hooks/usePagination'
import { sanitizeRichHtml } from './utils/sanitizeRichHtml'
import Toolbar from './components/layout/Toolbar'
import PageCanvas from './components/layout/PageCanvas'
import SettingsDrawer from './components/settings/SettingsDrawer'
import ProductModal from './components/product/ProductModal'
import RowEditModal from './components/editor/RowEditModal'

function InvoiceApp() {
  const { invoice } = useInvoice()
  const heightCache = useRef(new Map()).current
  const [heightVersion, setHeightVersion] = useState(0)
  const dirtyFromIndexRef = useRef(null)
  const rowsRef = useRef(invoice.rows)
  rowsRef.current = invoice.rows // eslint-disable-line react-hooks/refs
  const [headerH, setHeaderH] = useState(HEADER_ZONE_H)
  const onHeaderHeightChange = useCallback((h) => {
    setHeaderH(prev => Math.abs(prev - h) > 2 ? h : prev)
  }, [])

  // Measurement row ref — used by measureFragment to get real heights for split fragments.
  const measureRowRef = useRef(null)

  // Renders a candidate row into the hidden measurement <tr> and returns its offsetHeight.
  // Called synchronously during pagination when a row needs splitting, so the browser's
  // own layout engine determines the cut point — no character counting required.
  const measureFragment = useCallback((row) => {
    if (!measureRowRef.current) return 0
    const tr = measureRowRef.current
    tr.cells[1].innerHTML = sanitizeRichHtml(row.nameHtml || row.name || '')
    tr.cells[2].innerHTML = sanitizeRichHtml(row.descriptionHtml || row.description || '')
    return tr.offsetHeight
  }, [])

  const onRowHeightChange = useCallback((rowId, height) => {
    const markDirty = (id) => {
      const baseId = id.includes('_part_') ? id.split('_part_')[0] : id
      const idx = rowsRef.current.findIndex(r => r.id === baseId)
      if (idx !== -1 && (dirtyFromIndexRef.current === null || idx < dirtyFromIndexRef.current)) {
        dirtyFromIndexRef.current = idx
      }
    }

    if (height === null) {
      for (const key of [...heightCache.keys()]) {
        if (key === rowId || key === rowId + '_c' || key.startsWith(rowId + '_part_'))
          heightCache.delete(key)
      }
      markDirty(rowId)
      setHeightVersion(v => v + 1)
      return
    }
    const prev = heightCache.get(rowId)
    if (prev !== undefined && Math.abs(prev - height) <= 2) return
    heightCache.set(rowId, height)
    markDirty(rowId)
    setHeightVersion(v => v + 1)
  }, [heightCache])

  // eslint-disable-next-line react-hooks/refs
  const dirtyFrom = dirtyFromIndexRef.current
  dirtyFromIndexRef.current = null // eslint-disable-line react-hooks/refs

  const deferredRows = useDeferredValue(invoice.rows)
  const deferredHeaderH = useDeferredValue(headerH)
  const isPaginationPending = deferredRows !== invoice.rows || deferredHeaderH !== headerH

  // eslint-disable-next-line react-hooks/refs
  const allMeasured = deferredRows.length === 0 || deferredRows.every(r => heightCache.has(r.id))
  const pages = usePagination(allMeasured ? deferredRows : [], heightCache, heightVersion, deferredHeaderH, measureFragment, dirtyFrom)

  return (
    <>
      <Toolbar pageCount={pages.length} isPending={isPaginationPending} />
      <PageCanvas
        pages={pages}
        onRowHeightChange={onRowHeightChange}
        onHeaderHeightChange={onHeaderHeightChange}
        measureRowRef={measureRowRef}
      />
      <SettingsDrawer />
      <ProductModal />
      <RowEditModal />
    </>
  )
}

export default function App() {
  return (
    <InvoiceProvider>
      <InvoiceApp />
    </InvoiceProvider>
  )
}
