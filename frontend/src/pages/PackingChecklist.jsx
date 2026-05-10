import { useState, useEffect, useRef, useCallback } from 'react'
import { Trash2, Plus, Share2, RotateCcw, Package, FileText, Shirt, Plug, Search, ChevronDown, X, Check, Luggage } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useUser } from '../context/UserContext'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'

const API = import.meta.env.VITE_API_URL

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  return { Authorization: `Bearer ${session?.access_token}` }
}

const CATEGORIES = ['Documents', 'Clothing', 'Electronics', 'Other']

const SUGGESTIONS = {
  Documents: [
    'Passport', 'Flight Tickets', 'Travel Insurance', 'Hotel Booking Confirmation',
    'Visa Documents', 'Travel Itinerary', 'Emergency Contacts', 'Vaccination Certificate',
    'International Driving Permit', 'Travel Wallet', 'Copies of Important Documents',
  ],
  Clothing: [
    'Casual Shirts', 'Trousers/Jeans', 'Comfortable Walking Shoes', 'Light Jacket/Windbreaker',
    'Underwear', 'Socks', 'Swimwear', 'Formal Outfit', 'Pajamas', 'Belt', 'Sunglasses',
    'Hat/Cap', 'Scarf', 'Rain Jacket', 'Sandals', 'Sneakers', 'Shorts', 'Dress/Skirt',
  ],
  Electronics: [
    'Universal Power Adapter', 'Earphones/Headphones', 'Phone Charger', 'Laptop',
    'Laptop Charger', 'Power Bank', 'Camera', 'Camera Charger', 'Memory Cards',
    'USB Cables', 'E-Reader', 'Smartwatch', 'Noise-Cancelling Headphones',
  ],
  Other: [
    'Sunscreen', 'Toothbrush', 'Toothpaste', 'Shampoo', 'Conditioner', 'Deodorant',
    'Razor', 'First Aid Kit', 'Medications', 'Hand Sanitizer', 'Face Mask',
    'Snacks', 'Water Bottle', 'Travel Pillow', 'Eye Mask', 'Earplugs',
    'Umbrella', 'Luggage Lock', 'Laundry Bag', 'Travel Towel',
  ],
}

const CATEGORY_META = {
  Documents:   { icon: '📄', color: 'bg-blue-50 border-blue-100',   badge: 'bg-blue-100 text-blue-700' },
  Clothing:    { icon: '👕', color: 'bg-purple-50 border-purple-100', badge: 'bg-purple-100 text-purple-700' },
  Electronics: { icon: '🔌', color: 'bg-amber-50 border-amber-100',  badge: 'bg-amber-100 text-amber-700' },
  Other:       { icon: '📦', color: 'bg-slate-50 border-slate-200',  badge: 'bg-slate-100 text-slate-600' },
}

function progressColor(pct) {
  if (pct >= 80) return 'bg-green-500'
  if (pct >= 41) return 'bg-yellow-400'
  return 'bg-red-400'
}

function ConfirmModal({ title, message, confirmLabel = 'Confirm', danger = false, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 fade-in">
        <h3 className="text-lg font-bold text-dark mb-2">{title}</h3>
        <p className="text-slate-500 text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-sm font-medium text-white transition ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-teal-700'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function CategoryCard({ category, items, onToggle, onDelete, onAdd, search }) {
  const [adding, setAdding] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightedIdx, setHighlightedIdx] = useState(-1)
  const inputRef = useRef()
  const wrapperRef = useRef()
  const meta = CATEGORY_META[category] || CATEGORY_META.Other
  const packed = items.filter(i => i.is_packed).length
  const total = items.length

  const existingLabels = new Set(items.map(i => i.label.toLowerCase()))
  const allSuggestions = SUGGESTIONS[category] || []
  const filteredSuggestions = newLabel.trim()
    ? allSuggestions.filter(s =>
        s.toLowerCase().includes(newLabel.toLowerCase()) &&
        !existingLabels.has(s.toLowerCase())
      )
    : allSuggestions.filter(s => !existingLabels.has(s.toLowerCase())).slice(0, 6)

  const filtered = search
    ? items.filter(i => i.label.toLowerCase().includes(search.toLowerCase()))
    : items

  useEffect(() => { if (adding) inputRef.current?.focus() }, [adding])

  // close suggestions on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false)
        setHighlightedIdx(-1)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const commitAdd = (label) => {
    const val = (label || newLabel).trim()
    if (val) onAdd(category, val)
    setNewLabel('')
    setAdding(false)
    setShowSuggestions(false)
    setHighlightedIdx(-1)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIdx(i => Math.min(i + 1, filteredSuggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIdx(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightedIdx >= 0 && filteredSuggestions[highlightedIdx]) {
        commitAdd(filteredSuggestions[highlightedIdx])
      } else {
        commitAdd()
      }
    } else if (e.key === 'Escape') {
      setAdding(false)
      setNewLabel('')
      setShowSuggestions(false)
    }
  }

  return (
    <div className={`rounded-2xl border p-5 ${meta.color}`}>
      {/* Category header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{meta.icon}</span>
          <h3 className="font-bold text-dark text-base">{category}</h3>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${meta.badge}`}>
          {packed}/{total} packed
        </span>
      </div>

      {/* Items */}
      <div className="space-y-2 mb-3">
        {filtered.length === 0 && !adding ? (
          <p className="text-slate-400 text-sm text-center py-3">No items yet. Add one below ↓</p>
        ) : (
          filtered.map(item => (
            <div
              key={item.id}
              className={`flex items-center gap-3 bg-white rounded-xl px-3 py-2.5 border transition-all
                ${item.is_packed ? 'border-slate-100 opacity-70' : 'border-slate-200 shadow-sm'}`}
            >
              <button
                onClick={() => onToggle(item)}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all
                  ${item.is_packed ? 'bg-primary border-primary' : 'border-slate-300 hover:border-primary'}`}
              >
                {item.is_packed && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </button>
              <span className={`flex-1 text-sm transition-all ${item.is_packed ? 'line-through text-slate-400' : 'font-medium text-dark'}`}>
                {item.label}
              </span>
              <button
                onClick={() => onDelete(item)}
                className="p-1 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}

        {/* Inline add input with suggestions */}
        {adding && (
          <div ref={wrapperRef} className="relative">
            <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border-2 border-primary">
              <input
                ref={inputRef}
                value={newLabel}
                onChange={e => {
                  setNewLabel(e.target.value)
                  setShowSuggestions(true)
                  setHighlightedIdx(-1)
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
                placeholder="Type to search or add item..."
                className="flex-1 text-sm outline-none text-dark placeholder-slate-400 bg-transparent"
              />
              {newLabel && (
                <button
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => { setNewLabel(''); inputRef.current?.focus(); setHighlightedIdx(-1) }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onMouseDown={e => e.preventDefault()}
                onClick={() => { setAdding(false); setNewLabel(''); setShowSuggestions(false) }}
                className="text-slate-300 hover:text-slate-500 border-l border-slate-200 pl-2"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Suggestions dropdown */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
                <div className="px-3 py-1.5 border-b border-slate-100">
                  <p className="text-xs text-slate-400 font-medium">Suggestions</p>
                </div>
                <ul className="max-h-48 overflow-y-auto">
                  {filteredSuggestions.map((s, idx) => (
                    <li
                      key={s}
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => commitAdd(s)}
                      onMouseEnter={() => setHighlightedIdx(idx)}
                      className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-sm transition-colors
                        ${highlightedIdx === idx ? 'bg-teal-50 text-primary' : 'text-dark hover:bg-slate-50'}`}
                    >
                      <Plus className="w-3 h-3 shrink-0 opacity-50" />
                      {s}
                    </li>
                  ))}
                </ul>
                {newLabel.trim() && !allSuggestions.map(s => s.toLowerCase()).includes(newLabel.trim().toLowerCase()) && (
                  <div
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => commitAdd()}
                    className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-sm border-t border-slate-100 transition-colors
                      ${highlightedIdx === filteredSuggestions.length ? 'bg-teal-50 text-primary' : 'text-primary hover:bg-teal-50'}`}
                  >
                    <Plus className="w-3 h-3 shrink-0" />
                    Add &ldquo;{newLabel.trim()}&rdquo;
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add button */}
      {!adding && (
        <button
          onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-primary hover:text-primary text-sm font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add item to checklist
        </button>
      )}
    </div>
  )
}

export default function PackingChecklist() {
  const { user } = useUser()
  const [trips, setTrips] = useState([])
  const [selectedTripId, setSelectedTripId] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('category')
  const [groupBy, setGroupBy] = useState('category')
  const [showReset, setShowReset] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const realtimeRef = useRef()

  // load trips
  useEffect(() => {
    if (!user) return
    const load = async () => {
      const headers = await authHeaders()
      const res = await fetch(`${API}/api/trips?limit=all`, { headers })
      const data = await res.json()
      if (data.success) setTrips(data.trips)
    }
    load()
  }, [user])

  // load checklist for selected trip
  const loadChecklist = useCallback(async (tripId) => {
    if (!tripId) return
    setLoading(true)
    try {
      const headers = await authHeaders()
      const res = await fetch(`${API}/api/trips/${tripId}/checklist`, { headers })
      const data = await res.json()
      if (data.success) setItems(data.items)
    } catch { toast.error('Failed to load checklist') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (!selectedTripId) return
    loadChecklist(selectedTripId)

    // realtime subscription
    if (realtimeRef.current) supabase.removeChannel(realtimeRef.current)
    realtimeRef.current = supabase
      .channel(`checklist:${selectedTripId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checklist_items', filter: `trip_id=eq.${selectedTripId}` },
        payload => {
          if (payload.eventType === 'INSERT') setItems(prev => [...prev, payload.new])
          if (payload.eventType === 'UPDATE') setItems(prev => prev.map(i => i.id === payload.new.id ? payload.new : i))
          if (payload.eventType === 'DELETE') setItems(prev => prev.filter(i => i.id !== payload.old.id))
        }
      )
      .subscribe()
    return () => { if (realtimeRef.current) supabase.removeChannel(realtimeRef.current) }
  }, [selectedTripId, loadChecklist])

  // toggle packed — optimistic
  const handleToggle = async (item) => {
    const newVal = !item.is_packed
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_packed: newVal } : i))
    const headers = await authHeaders()
    const res = await fetch(`${API}/api/trips/${selectedTripId}/checklist/${item.id}`, {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_packed: newVal }),
    })
    const data = await res.json()
    if (!data.success) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_packed: item.is_packed } : i))
      toast.error('Failed to update item')
    }
  }

  // add item
  const handleAdd = async (category, label) => {
    const tempId = `temp-${Date.now()}`
    const optimistic = { id: tempId, label, category, is_packed: false, trip_id: selectedTripId, sort_order: 999 }
    setItems(prev => [...prev, optimistic])
    try {
      const headers = await authHeaders()
      const res = await fetch(`${API}/api/trips/${selectedTripId}/checklist`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, category }),
      })
      const data = await res.json()
      if (data.success) {
        setItems(prev => prev.map(i => i.id === tempId ? data.item : i))
        toast.success('Item added!')
      } else {
        setItems(prev => prev.filter(i => i.id !== tempId))
        toast.error('Failed to add item')
      }
    } catch {
      setItems(prev => prev.filter(i => i.id !== tempId))
      toast.error('Failed to add item')
    }
  }

  // delete item
  const handleDelete = async (item) => {
    setDeleteTarget(null)
    setItems(prev => prev.filter(i => i.id !== item.id))
    const headers = await authHeaders()
    const res = await fetch(`${API}/api/trips/${selectedTripId}/checklist/${item.id}`, { method: 'DELETE', headers })
    const data = await res.json()
    if (!data.success) {
      setItems(prev => [...prev, item])
      toast.error('Failed to delete item')
    } else toast.success('Item removed')
  }

  // reset all
  const handleReset = async () => {
    setShowReset(false)
    setItems(prev => prev.map(i => ({ ...i, is_packed: false })))
    const headers = await authHeaders()
    const res = await fetch(`${API}/api/trips/${selectedTripId}/checklist/reset`, { method: 'DELETE', headers })
    const data = await res.json()
    if (!data.success) {
      loadChecklist(selectedTripId)
      toast.error('Failed to reset')
    } else toast.success('Checklist reset!')
  }

  // share
  const handleShare = async () => {
    const headers = await authHeaders()
    const res = await fetch(`${API}/api/trips/${selectedTripId}/checklist/share`, { method: 'POST', headers })
    const data = await res.json()
    if (data.success) {
      const url = `${window.location.origin}/checklist/${selectedTripId}?token=${data.token}`
      navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard!')
    } else toast.error('Failed to generate share link')
  }

  // derived
  const packed = items.filter(i => i.is_packed).length
  const total = items.length
  const pct = total === 0 ? 0 : Math.round((packed / total) * 100)
  const selectedTrip = trips.find(t => t.id === selectedTripId)

  const getDisplayItems = (category) => {
    let list = items.filter(i => i.category === category)
    if (sortBy === 'alpha') list = [...list].sort((a, b) => a.label.localeCompare(b.label))
    if (sortBy === 'packed') list = [...list].sort((a, b) => Number(a.is_packed) - Number(b.is_packed))
    return list
  }

  const groupedByStatus = () => {
    const unpacked = items.filter(i => !i.is_packed)
    const packed_items = items.filter(i => i.is_packed)
    return { Unpacked: unpacked, Packed: packed_items }
  }

  const displayCategories = groupBy === 'category' ? CATEGORIES : null

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <div className="relative bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-400 overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10" />
        <div className="absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-white/10" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-3xl font-bold text-white mb-1">Packing Checklist</h1>
          <p className="text-teal-100 text-sm mb-6">Never forget a thing on your next trip</p>

          {/* Controls row */}
          <div className="flex flex-wrap gap-2">
            {/* Search */}
            <div className="flex items-center gap-2 flex-1 min-w-[180px] bg-white rounded-xl px-4 shadow-lg">
              <Search size={16} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search items..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 py-3 text-sm text-dark placeholder-slate-400 outline-none bg-transparent"
              />
              {search && <button onClick={() => setSearch('')}><X size={14} className="text-slate-400" /></button>}
            </div>

            {/* Group by */}
            <div className="flex items-center gap-1 bg-white rounded-xl px-3 shadow-lg">
              <span className="text-xs text-slate-400 whitespace-nowrap">Group by</span>
              <select value={groupBy} onChange={e => setGroupBy(e.target.value)} className="py-3 text-sm text-slate-600 outline-none bg-transparent pr-1">
                <option value="category">Category</option>
                <option value="status">Packed/Unpacked</option>
              </select>
            </div>

            {/* Sort by */}
            <div className="flex items-center gap-1 bg-white rounded-xl px-3 shadow-lg">
              <ChevronDown size={14} className="text-slate-400" />
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="py-3 text-sm text-slate-600 outline-none bg-transparent pr-1">
                <option value="category">Default</option>
                <option value="alpha">Alphabetical</option>
                <option value="packed">Packed Status</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Trip selector + progress */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Trip dropdown */}
            <div className="flex-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Select Trip</label>
              <div className="relative">
                <select
                  value={selectedTripId}
                  onChange={e => setSelectedTripId(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-dark outline-none focus:border-primary transition pr-8"
                >
                  <option value="">— Choose a trip —</option>
                  {trips.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Action buttons */}
            {selectedTripId && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                >
                  <Share2 className="w-4 h-4" /> Share
                </button>
                <button
                  onClick={() => setShowReset(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-red-200 text-red-500 hover:bg-red-50 transition"
                >
                  <RotateCcw className="w-4 h-4" /> Reset All
                </button>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {selectedTripId && total > 0 && (
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-dark">{packed}/{total} items packed</span>
                <span className={`text-sm font-bold ${pct >= 80 ? 'text-green-600' : pct >= 41 ? 'text-yellow-600' : 'text-red-500'}`}>{pct}%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${progressColor(pct)}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* No trip selected */}
        {!selectedTripId && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-teal-50 flex items-center justify-center mb-4">
              <span className="text-4xl">🧳</span>
            </div>
            <h3 className="text-lg font-semibold text-dark mb-1">No trip selected</h3>
            <p className="text-slate-400 text-sm">Select a trip above to view or build your packing checklist</p>
          </div>
        )}

        {/* Loading */}
        {selectedTripId && loading && (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-48 bg-white rounded-2xl border border-slate-200 animate-pulse" />)}
          </div>
        )}

        {/* Checklist — grouped by category */}
        {selectedTripId && !loading && groupBy === 'category' && (
          <div className="space-y-4">
            {CATEGORIES.map(cat => (
              <CategoryCard
                key={cat}
                category={cat}
                items={getDisplayItems(cat)}
                onToggle={handleToggle}
                onDelete={item => setDeleteTarget(item)}
                onAdd={handleAdd}
                search={search}
              />
            ))}
          </div>
        )}

        {/* Checklist — grouped by packed status */}
        {selectedTripId && !loading && groupBy === 'status' && (
          <div className="space-y-4">
            {Object.entries(groupedByStatus()).map(([status, statusItems]) => (
              <div key={status} className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-dark">{status}</h3>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">{statusItems.length} items</span>
                </div>
                {statusItems.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-3">No items here</p>
                ) : (
                  <div className="space-y-2">
                    {statusItems
                      .filter(i => !search || i.label.toLowerCase().includes(search.toLowerCase()))
                      .map(item => (
                        <div key={item.id} className={`flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2.5 border ${item.is_packed ? 'border-slate-100' : 'border-slate-200'}`}>
                          <button
                            onClick={() => handleToggle(item)}
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all
                              ${item.is_packed ? 'bg-primary border-primary' : 'border-slate-300 hover:border-primary'}`}
                          >
                            {item.is_packed && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                          </button>
                          <span className={`flex-1 text-sm ${item.is_packed ? 'line-through text-slate-400' : 'font-medium text-dark'}`}>{item.label}</span>
                          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{item.category}</span>
                          <button onClick={() => setDeleteTarget(item)} className="p-1 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reset confirm modal */}
      {showReset && (
        <ConfirmModal
          title="Reset Checklist?"
          message="This will mark all items as unpacked. This cannot be undone."
          confirmLabel="Reset All"
          danger
          onConfirm={handleReset}
          onCancel={() => setShowReset(false)}
        />
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <ConfirmModal
          title="Delete Item?"
          message={`Remove "${deleteTarget.label}" from your checklist?`}
          confirmLabel="Delete"
          danger
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
