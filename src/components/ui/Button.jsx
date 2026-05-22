const variants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 border border-transparent',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 border border-gray-300',
  danger: 'bg-red-600 text-white hover:bg-red-700 border border-transparent',
  icon: 'bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700 border border-transparent p-1.5 rounded',
}

export default function Button({ variant = 'primary', children, className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
