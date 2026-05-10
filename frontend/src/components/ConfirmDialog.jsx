import React, { useState, useEffect } from 'react'

export default function ConfirmDialog({ 
  message, 
  onConfirm, 
  onCancel, 
  confirmLabel = "Confirm", 
  confirmVariant = "danger" 
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const btnClass = confirmVariant === 'danger' 
    ? 'bg-[#EF4444] text-white hover:bg-red-600' 
    : 'bg-[#F97316] text-white hover:bg-orange-600'
    
  const containerClass = confirmVariant === 'danger'
    ? 'bg-[#FFF5F5] border-[#FCA5A5]'
    : 'bg-[#FFF7ED] border-[#FDBA74]'

  return (
    <div 
      className={`inline-flex items-center gap-3 px-3 py-2 border rounded-lg transition-opacity duration-150 ${containerClass} ${mounted ? 'opacity-100' : 'opacity-0'}`}
    >
      <span className="text-sm font-medium text-gray-800 flex items-center gap-2">
        <svg className={`w-4 h-4 ${confirmVariant === 'danger' ? 'text-[#EF4444]' : 'text-[#F97316]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        {message}
      </span>
      <div className="flex items-center gap-2 border-l pl-3 ml-1 border-gray-300">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${btnClass}`}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  )
}
