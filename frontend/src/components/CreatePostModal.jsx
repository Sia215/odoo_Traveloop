import { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useToast } from '../hooks/useToast'

const API = import.meta.env.VITE_API_URL

const CATEGORIES = ['General', 'Trip Review', 'Tips', 'Food', 'Adventure', 'Budget Travel']

const selectCls = 'w-full h-10 px-3 text-sm rounded-xl border border-slate-200 bg-white text-[#1E293B] outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] transition'

export default function CreatePostModal({ isOpen, onClose, onPostCreated }) {
  const { showToast } = useToast()
  const [form, setForm]           = useState({ title: '', content: '', category: 'General', trip_id: null })
  const [errors, setErrors]       = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userTrips, setUserTrips] = useState([])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Fetch user trips when modal opens
  useEffect(() => {
    if (!isOpen) return
    setForm({ title: '', content: '', category: 'General', trip_id: null })
    setErrors({})
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const res  = await fetch(`${API}/api/trips`, { headers: { Authorization: `Bearer ${session.access_token}` } })
      const data = await res.json()
      if (data.success) setUserTrips(data.trips || [])
    }
    load()
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  const validate = () => {
    const e = {}
    if (!form.title.trim() || form.title.trim().length < 5)
      e.title = 'Title must be at least 5 characters'
    if (form.title.trim().length > 100)
      e.title = 'Title must be under 100 characters'
    if (!form.content.trim() || form.content.trim().length < 10)
      e.content = 'Content must be at least 10 characters'
    if (form.content.trim().length > 1000)
      e.content = 'Content must be under 1000 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setIsSubmitting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${API}/api/community`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title:    form.title.trim(),
          content:  form.content.trim(),
          category: form.category,
          trip_id:  form.trip_id || null,
          tags:     [form.category],
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message)
      onPostCreated(data.post)
      onClose()
      showToast('Experience shared!', 'success')
    } catch {
      showToast('Failed to share. Try again.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', animation: 'fadeIn 150ms ease-out' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-lg shadow-2xl"
        style={{ animation: 'slideUp 200ms ease-out' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-[#0D9488]">Share Your Experience</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-[#1E293B]">Title</label>
              <span className="text-xs text-slate-400">{form.title.length} / 100</span>
            </div>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Give your experience a title..."
              maxLength={100}
              className={`w-full h-10 px-3 text-sm rounded-xl border bg-white text-[#1E293B] outline-none transition
                ${errors.title ? 'border-[#EF4444]' : 'border-slate-200 focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]'}`}
            />
            {errors.title && <p className="text-[#EF4444] text-xs mt-1">{errors.title}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-medium text-[#1E293B] block mb-1">Category</label>
            <select value={form.category} onChange={e => set('category', e.target.value)} className={selectCls}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Link a trip */}
          <div>
            <label className="text-xs font-medium text-[#1E293B] block mb-1">Link a Trip <span className="text-slate-400 font-normal">(optional)</span></label>
            <select
              value={form.trip_id || ''}
              onChange={e => set('trip_id', e.target.value || null)}
              className={selectCls}
            >
              <option value="">None (general post)</option>
              {userTrips.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} · {t.status}
                </option>
              ))}
            </select>
          </div>

          {/* Content */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-[#1E293B]">Your Experience</label>
              <span className="text-xs text-slate-400">{form.content.length} / 1000</span>
            </div>
            <textarea
              value={form.content}
              onChange={e => set('content', e.target.value)}
              placeholder="Share your experience, tips, or travel story..."
              maxLength={1000}
              rows={5}
              className={`w-full px-3 py-2.5 text-sm rounded-xl border bg-white text-[#1E293B] outline-none transition resize-none
                ${errors.content ? 'border-[#EF4444]' : 'border-slate-200 focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]'}`}
            />
            {errors.content && <p className="text-[#EF4444] text-xs mt-1">{errors.content}</p>}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-[#0D9488] hover:bg-teal-700 rounded-xl transition disabled:opacity-60 flex items-center gap-2"
            >
              {isSubmitting && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Share Post
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
    </div>
  )
}
