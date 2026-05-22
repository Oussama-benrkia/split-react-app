import { forwardRef } from 'react'

const Dropdown = forwardRef(function Dropdown({ children, className = '' }, ref) {
  return (
    <div ref={ref} className={`absolute z-40 bg-white border border-gray-200 rounded-xl shadow-xl ${className}`}>
      {children}
    </div>
  )
})

export default Dropdown
