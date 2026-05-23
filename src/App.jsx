import { useState, useCallback, useRef } from 'react'
import { InvoiceProvider, useInvoice } from './context/InvoiceContext'
import { usePagination, HEADER_ZONE_H } from './hooks/usePagination'
import Toolbar from './components/layout/Toolbar'
import PageCanvas from './components/layout/PageCanvas'
import SettingsDrawer from './components/settings/SettingsDrawer'
import ProductModal from './components/product/ProductModal'
import RowEditModal from './components/editor/RowEditModal'

function InvoiceApp() {
  const { invoice } = useInvoice()
  const heightCache = useRef(new Map()).current
  const firstPartHeightCache = useRef(new Map()).current // FIX: separate cache for _isFirstPart rendered heights
  const [heightVersion, setHeightVersion] = useState(0)
  const [headerH, setHeaderH] = useState(HEADER_ZONE_H)
  const [textMetrics, setTextMetrics] = useState({})

  const onRowHeightChange = useCallback((rowId, height) => {
    if (height === null) {                                        // FIX 4: null signals cache invalidation for an edited row
      for (const key of [...heightCache.keys()]) {               // FIX 4
        if (key === rowId || key.startsWith(rowId + '_part_'))   // FIX 4: clear main key and all split-part keys
          heightCache.delete(key)                                 // FIX 4
      }                                                           // FIX 4
      firstPartHeightCache.delete(rowId)                         // FIX: also evict first-part cache entry on row edit
      setHeightVersion(v => v + 1)                               // FIX 4
      return                                                      // FIX 4
    }                                                             // FIX 4
    if (rowId.endsWith('__fp')) {                                 // FIX: route _isFirstPart reports to dedicated cache
      const realId = rowId.slice(0, -4)                          // FIX: strip '__fp' suffix (4 chars) to recover original row.id
      if (firstPartHeightCache.get(realId) === height) return    // FIX: bail out when unchanged — prevents re-render cascade
      firstPartHeightCache.set(realId, height)                   // FIX: store in firstPartHeightCache, not heightCache
      setHeightVersion(v => v + 1)                               // FIX
      return                                                      // FIX
    }                                                             // FIX
    if (heightCache.get(rowId) === height) return                 // FIX 2: bail out when height is unchanged to stop re-render cascade
    heightCache.set(rowId, height)
    setHeightVersion(v => v + 1)
  }, [heightCache, firstPartHeightCache]) // FIX: firstPartHeightCache added to deps

  const pages = usePagination(invoice.rows, heightCache, heightVersion, headerH, textMetrics, firstPartHeightCache) // FIX: pass firstPartHeightCache as 6th arg

  return (
    <>
      <Toolbar pageCount={pages.length} />
      <PageCanvas
        pages={pages}
        onRowHeightChange={onRowHeightChange}
        onHeaderHeightChange={setHeaderH}
        onTextMetricsChange={setTextMetrics}
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
