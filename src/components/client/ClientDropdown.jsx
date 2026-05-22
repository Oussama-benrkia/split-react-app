import { useState, useRef } from 'react'
import { Search, UserPlus } from 'lucide-react'
import { useInvoice } from '../../context/InvoiceContext'
import { useOutsideClick } from '../../hooks/useOutsideClick'
import Dropdown from '../ui/Dropdown'
import ClientListItem from './ClientListItem'
import ClientForm from './ClientForm'

export default function ClientDropdown({ anchorRef }) {
  const { clients, invoice, setSelectedClient, ui, closeClientDropdown } = useInvoice()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const dropRef = useRef(null)

  useOutsideClick(dropRef, closeClientDropdown, ui.clientDropdownOpen)

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.company ?? '').toLowerCase().includes(search.toLowerCase())
  )

  function handleSelect(client) {
    setSelectedClient(client)
    closeClientDropdown()
  }

  if (!ui.clientDropdownOpen) return null

  return (
    <Dropdown className="top-full left-0 mt-1 w-72" ref={dropRef}>
      {/* Search */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50">
          <Search size={13} className="text-gray-400" />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
          />
        </div>
      </div>

      {/* List */}
      <div className="max-h-48 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="px-4 py-3 text-xs text-gray-400 text-center">Aucun client trouvé</div>
        )}
        {filtered.map(c => (
          <ClientListItem
            key={c.id}
            client={c}
            selected={invoice.selectedClient?.id === c.id}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {/* Add new */}
      {!showForm ? (
        <div className="border-t border-gray-100">
          <button
            onClick={() => setShowForm(true)}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
          >
            <UserPlus size={14} />
            Ajouter un client
          </button>
        </div>
      ) : (
        <ClientForm
          onSave={() => { setShowForm(false); closeClientDropdown() }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </Dropdown>
  )
}
