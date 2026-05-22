import { useRef } from 'react'
import { Upload, X } from 'lucide-react'

export default function LogoUploader({ logo, onChange }) {
  const inputRef = useRef(null)

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => onChange(ev.target.result)
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-gray-600">Logo de l'entreprise</label>
      <div className="flex items-center gap-3">
        {logo ? (
          <div className="relative">
            <img src={logo} alt="logo" className="h-14 w-auto object-contain border border-gray-200 rounded p-1" />
            <button
              onClick={() => onChange(null)}
              className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 cursor-pointer hover:bg-red-600"
            >
              <X size={10} />
            </button>
          </div>
        ) : (
          <div
            onClick={() => inputRef.current?.click()}
            className="h-14 w-28 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-400 cursor-pointer transition-colors"
          >
            <Upload size={16} />
            <span className="text-xs mt-1">Upload</span>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
    </div>
  )
}
