import { ChevronDown } from 'lucide-react'

export default function ClientInfo({ client, onClick, readOnly = false }) {
  if (!client) {
    if (readOnly) return null

    return (
      <div
        onClick={onClick}
        className="flex flex-col gap-1 p-3 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors group"
      >
        <div className="flex items-center gap-2 text-gray-400 group-hover:text-blue-500">
          <ChevronDown size={14} />
          <span className="text-sm font-medium">Sélectionner un client</span>
        </div>
        <p className="text-xs text-gray-400">Cliquez pour choisir ou créer un client</p>
      </div>
    )
  }

  if (readOnly) {
    return (
      <div className="flex flex-col gap-0.5 p-3 rounded-lg border border-gray-200">
        <span className="text-sm font-bold text-gray-800">{client.name}</span>
        {client.company && <div className="text-xs font-medium text-blue-600">{client.company}</div>}
        {client.address && <div className="text-xs text-gray-500 mt-1">{client.address}</div>}
        {client.email && <div className="text-xs text-gray-500">{client.email}</div>}
        {client.phone && <div className="text-xs text-gray-500">{client.phone}</div>}
        {client.taxId && <div className="text-xs text-gray-400 mt-1">{client.taxId}</div>}
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      className="flex flex-col gap-0.5 p-3 rounded-lg border border-gray-200 cursor-pointer hover:border-blue-300 hover:bg-blue-50/20 transition-colors group"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-gray-800">{client.name}</span>
        <ChevronDown size={12} className="text-gray-400 group-hover:text-blue-400 flex-shrink-0" />
      </div>
      {client.company && <div className="text-xs font-medium text-blue-600">{client.company}</div>}
      {client.address && <div className="text-xs text-gray-500 mt-1">{client.address}</div>}
      {client.email && <div className="text-xs text-gray-500">{client.email}</div>}
      {client.phone && <div className="text-xs text-gray-500">{client.phone}</div>}
      {client.taxId && <div className="text-xs text-gray-400 mt-1">{client.taxId}</div>}
    </div>
  )
}
