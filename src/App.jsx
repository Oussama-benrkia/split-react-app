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
  const [heightVersion, setHeightVersion] = useState(0)
  const [headerH, setHeaderH] = useState(HEADER_ZONE_H)
  const [textMetrics, setTextMetrics] = useState({})

  const onRowHeightChange = useCallback((rowId, height) => {
    if (heightCache.get(rowId) !== height) {
      heightCache.set(rowId, height)
      setHeightVersion(v => v + 1)
    }
  }, [heightCache])

  const pages = usePagination(invoice.rows, heightCache, heightVersion, headerH, textMetrics)

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
