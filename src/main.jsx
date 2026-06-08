import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 48, textAlign: 'center', fontFamily: 'system-ui', color: '#374151' }}>
          <h2 style={{ marginBottom: 12 }}>Une erreur inattendue s'est produite</h2>
          <p style={{ color: '#6b7280', marginBottom: 32, fontFamily: 'monospace', fontSize: 13 }}>
            {String(this.state.error)}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{ marginRight: 12, padding: '8px 18px', cursor: 'pointer', borderRadius: 6, border: '1px solid #d1d5db', background: '#f9fafb' }}
          >
            Recharger
          </button>
          <button
            onClick={() => { localStorage.removeItem('invoice-studio-state'); window.location.reload() }}
            style={{ padding: '8px 18px', cursor: 'pointer', borderRadius: 6, border: '1px solid #fca5a5', background: '#fef2f2', color: '#b91c1c' }}
          >
            Réinitialiser les données
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

const rootEl = document.getElementById('root')
const root = rootEl._reactRoot ?? (rootEl._reactRoot = createRoot(rootEl))
root.render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
