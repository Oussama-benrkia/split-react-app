const SIZES = [12, 14, 16, 18]

export default function FontSizePicker({ onSize }) {
  return (
    <div className="flex items-center gap-0.5">
      {SIZES.map(s => (
        <button
          key={s}
          onMouseDown={(e) => { e.preventDefault(); onSize(s) }}
          className="px-1.5 py-1 text-xs rounded text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors cursor-pointer font-mono leading-none"
          title={`${s}px`}
        >
          {s}
        </button>
      ))}
    </div>
  )
}
