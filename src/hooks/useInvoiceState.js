import { useReducer, useEffect, useRef } from 'react'
import seedData from '../data.json'

function generateId() {
  return crypto.randomUUID()
}

function formatInvoiceNumber(prefix, num) {
  return `${prefix}-${String(num).padStart(4, '0')}`
}

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

function getDueDate(days = 30) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function buildInitialState() {
  const { company, invoiceDefaults, footer, clients, products } = seedData
  return {
    invoice: {
      id: generateId(),
      number: formatInvoiceNumber(invoiceDefaults.invoiceNumberPrefix, invoiceDefaults.nextInvoiceNumber),
      date: getToday(),
      dueDate: getDueDate(invoiceDefaults.paymentTermsDays),
      labelText: invoiceDefaults.labelText,
      selectedClient: null,
      rows: [],
      tvaRate: invoiceDefaults.tvaRate,
      discountPercent: invoiceDefaults.discountPercent,
      currency: invoiceDefaults.currency,
    },
    clients: clients.map(c => ({ ...c })),
    products: products.map(p => ({ ...p })),
    settings: {
      company: { ...company },
      defaults: { ...invoiceDefaults },
      footer: { ...footer },
    },
    ui: {
      settingsOpen: false,
      productModalOpen: false,
      rowEditModal: { open: false, rowId: null },
      clientDropdownOpen: false,
    },
  }
}

function loadState() {
  try {
    const saved = localStorage.getItem('invoice-studio-state')
    if (!saved) return null
    const parsed = JSON.parse(saved)
    parsed.ui = {
      settingsOpen: false,
      productModalOpen: false,
      rowEditModal: { open: false, rowId: null },
      clientDropdownOpen: false,
    }
    return parsed
  } catch {
    return null
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_CLIENT':
      return { ...state, invoice: { ...state.invoice, selectedClient: action.client } }

    case 'ADD_ROW': {
      const newRow = {
        id: generateId(),
        name: action.product?.name ?? 'Nouveau service',
        nameHtml: action.product?.nameHtml ?? action.product?.name ?? 'Nouveau service',
        description: action.product?.description ?? '',
        descriptionHtml: action.product?.descriptionHtml ?? action.product?.description ?? '',
        qty: 1,
        unitPrice: action.product?.unitPrice ?? 0,
      }
      return { ...state, invoice: { ...state.invoice, rows: [...state.invoice.rows, newRow] } }
    }

    case 'UPDATE_ROW':
      return {
        ...state,
        invoice: {
          ...state.invoice,
          rows: state.invoice.rows.map(r => r.id === action.rowId ? { ...r, ...action.fields } : r),
        },
      }

    case 'DUPLICATE_ROW': {
      const idx = state.invoice.rows.findIndex(r => r.id === action.rowId)
      if (idx === -1) return state
      const clone = { ...state.invoice.rows[idx], id: generateId() }
      const rows = [...state.invoice.rows]
      rows.splice(idx + 1, 0, clone)
      return { ...state, invoice: { ...state.invoice, rows } }
    }

    case 'REMOVE_ROW':
      return {
        ...state,
        invoice: { ...state.invoice, rows: state.invoice.rows.filter(r => r.id !== action.rowId) },
      }

    case 'SET_TVA':
      return { ...state, invoice: { ...state.invoice, tvaRate: action.rate } }

    case 'SET_DISCOUNT':
      return { ...state, invoice: { ...state.invoice, discountPercent: action.pct } }

    case 'SET_LABEL':
      return { ...state, invoice: { ...state.invoice, labelText: action.text } }

    case 'SET_DATE':
      return { ...state, invoice: { ...state.invoice, date: action.date } }

    case 'SET_DUE_DATE':
      return { ...state, invoice: { ...state.invoice, dueDate: action.date } }

    case 'ADD_CLIENT': {
      const client = { id: generateId(), ...action.data }
      const nextState = { ...state, clients: [...state.clients, client] }
      if (action.andSelect) {
        nextState.invoice = { ...nextState.invoice, selectedClient: client }
      }
      return nextState
    }

    case 'ADD_PRODUCT': {
      const product = { id: generateId(), ...action.data }
      return { ...state, products: [...state.products, product] }
    }

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, [action.section]: { ...state.settings[action.section], ...action.data } },
      }

    case 'RESET_INVOICE': {
      const { defaults } = state.settings
      const nextNum = (state.settings.defaults.nextInvoiceNumber ?? 1) + 1
      const updatedDefaults = { ...defaults, nextInvoiceNumber: nextNum }
      return {
        ...state,
        invoice: {
          id: generateId(),
          number: formatInvoiceNumber(defaults.invoiceNumberPrefix, nextNum),
          date: getToday(),
          dueDate: getDueDate(defaults.paymentTermsDays),
          labelText: defaults.labelText,
          selectedClient: null,
          rows: [],
          tvaRate: defaults.tvaRate,
          discountPercent: 0,
          currency: defaults.currency,
        },
        settings: { ...state.settings, defaults: updatedDefaults },
        ui: { settingsOpen: false, productModalOpen: false, rowEditModal: { open: false, rowId: null }, clientDropdownOpen: false },
      }
    }

    case 'TOGGLE_SETTINGS':
      return { ...state, ui: { ...state.ui, settingsOpen: !state.ui.settingsOpen } }

    case 'TOGGLE_PRODUCT_MODAL':
      return { ...state, ui: { ...state.ui, productModalOpen: !state.ui.productModalOpen } }

    case 'SET_ROW_EDIT_MODAL':
      return { ...state, ui: { ...state.ui, rowEditModal: action.payload } }

    case 'TOGGLE_CLIENT_DROPDOWN':
      return { ...state, ui: { ...state.ui, clientDropdownOpen: !state.ui.clientDropdownOpen } }

    case 'CLOSE_CLIENT_DROPDOWN':
      return { ...state, ui: { ...state.ui, clientDropdownOpen: false } }

    default:
      return state
  }
}

export function useInvoiceState() {
  const [state, dispatch] = useReducer(reducer, null, () => loadState() ?? buildInitialState())
  const timerRef = useRef(null)

  useEffect(() => {
    const { ui, ...persisted } = state
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      localStorage.setItem('invoice-studio-state', JSON.stringify(persisted))
    }, 500)
    return () => clearTimeout(timerRef.current)
  }, [state])

  return { state, dispatch }
}
