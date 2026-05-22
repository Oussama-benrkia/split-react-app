import { createContext, useContext } from 'react'
import { useInvoiceState } from '../hooks/useInvoiceState'

const InvoiceContext = createContext(null)

export function InvoiceProvider({ children }) {
  const { state, dispatch } = useInvoiceState()

  const ctx = {
    // State slices
    invoice: state.invoice,
    clients: state.clients,
    products: state.products,
    settings: state.settings,
    ui: state.ui,

    // Invoice actions
    setSelectedClient: (client) => dispatch({ type: 'SET_CLIENT', client }),
    addRow: (product) => dispatch({ type: 'ADD_ROW', product }),
    updateRow: (rowId, fields) => dispatch({ type: 'UPDATE_ROW', rowId, fields }),
    duplicateRow: (rowId) => dispatch({ type: 'DUPLICATE_ROW', rowId }),
    removeRow: (rowId) => dispatch({ type: 'REMOVE_ROW', rowId }),
    setTvaRate: (rate) => dispatch({ type: 'SET_TVA', rate }),
    setDiscountPercent: (pct) => dispatch({ type: 'SET_DISCOUNT', pct }),
    setLabelText: (text) => dispatch({ type: 'SET_LABEL', text }),
    setInvoiceDate: (date) => dispatch({ type: 'SET_DATE', date }),
    setInvoiceDueDate: (date) => dispatch({ type: 'SET_DUE_DATE', date }),
    resetInvoice: () => dispatch({ type: 'RESET_INVOICE' }),

    // Client / Product
    addClient: (data, andSelect = false) => dispatch({ type: 'ADD_CLIENT', data, andSelect }),
    addProduct: (data) => dispatch({ type: 'ADD_PRODUCT', data }),

    // Settings
    updateSettings: (section, data) => dispatch({ type: 'UPDATE_SETTINGS', section, data }),

    // UI toggles
    openSettings: () => dispatch({ type: 'TOGGLE_SETTINGS' }),
    closeSettings: () => dispatch({ type: 'TOGGLE_SETTINGS' }),
    openProductModal: () => { if (!state.ui.productModalOpen) dispatch({ type: 'TOGGLE_PRODUCT_MODAL' }) },
    closeProductModal: () => { if (state.ui.productModalOpen) dispatch({ type: 'TOGGLE_PRODUCT_MODAL' }) },
    openRowEditModal: (rowId) => dispatch({ type: 'SET_ROW_EDIT_MODAL', payload: { open: true, rowId } }),
    closeRowEditModal: () => dispatch({ type: 'SET_ROW_EDIT_MODAL', payload: { open: false, rowId: null } }),
    openClientDropdown: () => { if (!state.ui.clientDropdownOpen) dispatch({ type: 'TOGGLE_CLIENT_DROPDOWN' }) },
    closeClientDropdown: () => dispatch({ type: 'CLOSE_CLIENT_DROPDOWN' }),
  }

  return <InvoiceContext.Provider value={ctx}>{children}</InvoiceContext.Provider>
}

export function useInvoice() {
  const ctx = useContext(InvoiceContext)
  if (!ctx) throw new Error('useInvoice must be used within InvoiceProvider')
  return ctx
}
