const COLORS = ['#000000', '#374151', '#DC2626', '#D97706', '#059669', '#2563EB', '#7C3AED', '#DB2777']

export default function ColorPalette({ onColor }) {
  return (
    <div className="flex items-center gap-1">
      {COLORS.map(hex => (
        <button
          key={hex}
          title={hex}
          onMouseDown={(e) => { e.preventDefault(); onColor(hex) }}
          style={{ backgroundColor: hex }}
          className="w-4 h-4 rounded-sm border border-white shadow-sm hover:scale-125 transition-transform cursor-pointer"
        />
      ))}
    </div>
  )
}
