export default function A4Page({ children, pageNumber, isLast }) {
  return (
    <div
      className="a4-page relative bg-white"
      style={{
        width: 794,
        height: 1123,
        overflow: 'hidden',
        padding: '48px 40px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.13), 0 1.5px 6px rgba(0,0,0,0.08)',
        marginBottom: 32,
        position: 'relative',
      }}
    >
      {children}
      <div
        className="absolute bottom-3 right-4 text-xs text-gray-300 select-none"
        data-print-hide
      >
        p.{pageNumber}
      </div>
    </div>
  )
}
