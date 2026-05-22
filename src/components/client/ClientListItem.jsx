export default function ClientListItem({ client, selected, onSelect }) {
  const initial = client.name.charAt(0).toUpperCase()
  const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-orange-500', 'bg-rose-500']
  const color = colors[client.name.charCodeAt(0) % colors.length]

  return (
    <div
      onClick={() => onSelect(client)}
      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors ${selected ? 'bg-blue-50' : ''}`}
    >
      <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-800 truncate">{client.name}</div>
        <div className="text-xs text-gray-500 truncate">{client.company}</div>
      </div>
      {selected && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
    </div>
  )
}
