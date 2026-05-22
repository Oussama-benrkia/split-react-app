export default function Divider({ label, className = '' }) {
  if (!label) return <hr className={`border-gray-200 my-3 ${className}`} />
  return (
    <div className={`flex items-center gap-2 my-3 ${className}`}>
      <hr className="flex-1 border-gray-200" />
      <span className="text-xs text-gray-400 font-medium">{label}</span>
      <hr className="flex-1 border-gray-200" />
    </div>
  )
}
