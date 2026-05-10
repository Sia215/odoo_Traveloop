import { useEffect } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'

const TYPE_STYLES = {
  success: { bg: 'bg-primary',  icon: CheckCircle },
  error:   { bg: 'bg-red-500',  icon: AlertCircle },
  warning: { bg: 'bg-accent',   icon: AlertTriangle },
  info:    { bg: 'bg-dark',     icon: Info },
}

/**
 * Single toast notification.
 * @param {{ id: string, message: string, type: string, onClose: Function }} props
 */
function ToastItem({ id, message, type, onClose }) {
  const { bg, icon: Icon } = TYPE_STYLES[type] ?? TYPE_STYLES.info

  useEffect(() => {
    const t = setTimeout(() => onClose(id), 3000)
    return () => clearTimeout(t)
  }, [id, onClose])

  return (
    <div className={`flex items-center gap-3 ${bg} text-white px-4 py-3 rounded-xl shadow-lg
      min-w-[260px] max-w-sm animate-slide-in`}>
      <Icon size={18} className="shrink-0" />
      <p className="text-sm font-medium flex-1">{message}</p>
      <button onClick={() => onClose(id)} className="shrink-0 hover:opacity-70 transition">
        <X size={16} />
      </button>
    </div>
  )
}

/**
 * Toast container — renders all active toasts top-right.
 * @param {{ toasts: Array, removeToast: Function }} props
 */
export default function Toast({ toasts, removeToast }) {
  if (!toasts.length) return null
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map(t => (
        <ToastItem key={t.id} {...t} onClose={removeToast} />
      ))}
    </div>
  )
}
