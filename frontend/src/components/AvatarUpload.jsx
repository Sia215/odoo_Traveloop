import { useRef, useState } from 'react'
import { Camera } from 'lucide-react'

export default function AvatarUpload({ onFileSelect }) {
  const [preview, setPreview] = useState(null)
  const inputRef = useRef()

  const handleChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    onFileSelect(file)
  }

  return (
    <div className="flex flex-col items-center mb-6">
      <button
        type="button"
        onClick={() => inputRef.current.click()}
        className="relative w-20 h-20 rounded-full border-2 border-dashed border-primary/40 bg-teal-50
          hover:border-primary hover:bg-teal-100 transition overflow-hidden group"
      >
        {preview ? (
          <img src={preview} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-1 text-primary/60 group-hover:text-primary transition">
            <Camera size={22} />
            <span className="text-[10px] font-medium">Upload</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
          <Camera size={20} className="text-white" />
        </div>
      </button>
      <p className="text-xs text-slate-400 mt-2">Click to upload photo</p>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
    </div>
  )
}
