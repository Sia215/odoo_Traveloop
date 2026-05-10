import { useState, useCallback } from 'react'

/**
 * @returns {{ toasts: Array, showToast: Function, removeToast: Function }}
 */
export function useToast() {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showToast = useCallback((message, type = 'info') => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => removeToast(id), 3000)
  }, [removeToast])

  return { toasts, showToast, removeToast }
}
