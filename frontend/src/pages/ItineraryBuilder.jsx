import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, MapPin, Eye } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useToast } from '../hooks/useToast'
import Navbar from '../components/Navbar'
import SectionCard from '../components/SectionCard'
import EmptyState from '../components/EmptyState'
import Toast from '../components/Toast'

const API = import.meta.env.VITE_API_URL

/** @returns {string} Bearer token */
async function getToken() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token
}

/** @param {number} index @returns {{ id:string, description:string, start_date:string, end_date:string, budget:string, order_index:number }} */
const makeBlankSection = (index) => ({
  id: crypto.randomUUID(),
  description: '',
  start_date: '',
  end_date: '',
  budget: '',
  order_index: index,
})

/** @param {string} a @param {string} b @returns {number} */
function daysBetween(a, b) {
  if (!a || !b) return 0
  return Math.max(0, Math.ceil((new Date(b) - new Date(a)) / 86400000))
}

/** @param {string} d @returns {string} */
function fmt(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function SectionSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-3 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-slate-100" />
        <div className="h-3 w-24 bg-slate-100 rounded" />
      </div>
      <div className="h-12 bg-slate-100 rounded-lg" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-9 bg-slate-100 rounded-lg" />
        <div className="h-9 bg-slate-100 rounded-lg" />
      </div>
      <div className="h-9 bg-slate-100 rounded-lg" />
    </div>
  )
}

export default function ItineraryBuilder() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const { toasts, showToast, removeToast } = useToast()

  const [trip, setTrip]           = useState(null)
  const [sections, setSections]   = useState([])
  const [isSaving, setIsSaving]   = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound]   = useState(false)
  const [errors, setErrors]       = useState({})
  const [dragIndex, setDragIndex] = useState(null)
  const [hasSaved, setHasSaved]   = useState(false)

  // Warn on unsaved changes
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [sections])

  // Load trip + existing sections
  useEffect(() => {
    const load = async () => {
      const token = await getToken()
      if (!token) { navigate('/login'); return }

      const [tripRes, secRes] = await Promise.all([
        fetch(`${API}/api/trips/${tripId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API}/api/trips/${tripId}/sections`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      const tripData = await tripRes.json()
      const secData  = await secRes.json()

      if (!tripData.success) { setNotFound(true); setIsLoading(false); return }
      setTrip(tripData.trip)

      if (secData.success && secData.sections.length > 0) {
        setSections(secData.sections.map((s, i) => ({
          id:          s.id || crypto.randomUUID(),
          description: s.description || '',
          start_date:  s.start_date  || '',
          end_date:    s.end_date    || '',
          budget:      s.budget != null ? String(s.budget) : '',
          order_index: i,
        })))
        setHasSaved(true)
      } else {
        setSections([makeBlankSection(0), makeBlankSection(1), makeBlankSection(2)])
      }
      setIsLoading(false)
    }
    load()
  }, [tripId, navigate])

  // Live budget total
  const totalBudget = sections.reduce((sum, s) => sum + (parseFloat(s.budget) || 0), 0)

  // Section handlers
  const handleChange = useCallback((index, field, value) => {
    setSections(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s))
    setErrors(prev => {
      const e = { ...prev }
      if (e[index]) { delete e[index][field]; if (!Object.keys(e[index]).length) delete e[index] }
      return e
    })
  }, [])

  const handleRemove = useCallback((index) => {
    setSections(prev =>
      prev.filter((_, i) => i !== index)
          .map((s, i) => ({ ...s, order_index: i }))
    )
  }, [])

  const handleAddSection = () => {
    if (sections.length >= 10) { showToast('Maximum 10 sections allowed', 'warning'); return }
    setSections(prev => [...prev, makeBlankSection(prev.length)])
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100)
  }

  // Drag handlers
  const handleDragStart = (i) => setDragIndex(i)
  const handleDragOver  = (e) => e.preventDefault()
  const handleDrop      = (i) => {
    if (dragIndex === null || dragIndex === i) { setDragIndex(null); return }
    setSections(prev => {
      const arr = [...prev]
      const [moved] = arr.splice(dragIndex, 1)
      arr.splice(i, 0, moved)
      return arr.map((s, idx) => ({ ...s, order_index: idx }))
    })
    setDragIndex(null)
  }

  // Validation
  const validate = () => {
    const errs = {}
    const allBlank = sections.every(
      s => !s.description.trim() && !s.start_date && !s.end_date && !s.budget
    )
    if (allBlank) {
      showToast('Please fill in at least one section before saving.', 'warning')
      return null
    }

    sections.forEach((s, i) => {
      const e = {}
      if (s.start_date && trip?.start_date && s.start_date < trip.start_date)
        e.start_date = `Must be on or after trip start (${fmt(trip.start_date)})`
      if (s.start_date && trip?.end_date && s.start_date > trip.end_date)
        e.start_date = `Must be on or before trip end (${fmt(trip.end_date)})`
      if (s.end_date && s.start_date && s.end_date < s.start_date)
        e.end_date = 'End date must be after start date'
      if (s.end_date && trip?.end_date && s.end_date > trip.end_date)
        e.end_date = `Must be on or before trip end (${fmt(trip.end_date)})`
      if (s.budget && parseFloat(s.budget) < 0)
        e.budget = 'Budget cannot be negative'
      if (Object.keys(e).length) errs[i] = e
    })
    return errs
  }

  // Save
  const handleSave = async () => {
    const errs = validate()
    if (errs === null) return
    if (Object.keys(errs).length) { setErrors(errs); showToast('Fix errors before saving', 'error'); return }
    setErrors({})
    setIsSaving(true)

    const token = await getToken()
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

    const [secRes, tripRes] = await Promise.all([
      fetch(`${API}/api/trips/${tripId}/sections`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          sections: sections.map(s => ({
            description: s.description,
            start_date:  s.start_date  || null,
            end_date:    s.end_date    || null,
            budget:      parseFloat(s.budget) || 0,
            order_index: s.order_index,
          })),
        }),
      }),
      fetch(`${API}/api/trips/${tripId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ destination_count: sections.length }),
      }),
    ])

    const secData  = await secRes.json()
    setIsSaving(false)

    if (!secData.success) { showToast('Failed to save. Please try again.', 'error'); return }

    setHasSaved(true)
    showToast('Itinerary saved successfully!', 'success')
    setTimeout(() => navigate('/my-trips'), 1500)
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (notFound) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-16">
          <EmptyState
            icon={MapPin}
            message="Trip not found or you don't have access."
            ctaLabel="Go to My Trips"
            onCta={() => navigate('/my-trips')}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <Navbar />
      <Toast toasts={toasts} removeToast={removeToast} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 fade-in">

        {/* Header nav row */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/create-trip')}
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline transition"
          >
            <ArrowLeft size={15} /> Back to Trip Details
          </button>
          {hasSaved && (
            <button
              onClick={() => showToast('Itinerary view coming soon', 'info')}
              className="inline-flex items-center gap-1.5 text-sm font-semibold border-2 border-primary
                text-primary px-3 py-1.5 rounded-xl hover:bg-teal-50 transition"
            >
              View Itinerary <Eye size={14} />
            </button>
          )}
        </div>

        {/* Page heading */}
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-dark">Build Your Itinerary</h1>
          {trip && <p className="text-slate-400 text-sm mt-1">{trip.name}</p>}
        </div>

        {/* Trip summary bar */}
        {trip && (
          <div className="bg-white rounded-lg px-4 py-3 mb-8 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm"
            style={{ borderLeft: '4px solid #0D9488', border: '1px solid #e2e8f0', borderLeftWidth: 4, borderLeftColor: '#0D9488' }}>
            <span className="font-semibold text-dark flex items-center gap-1.5">
              <MapPin size={13} className="text-primary" /> {trip.name}
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-500">{fmt(trip.start_date)} → {fmt(trip.end_date)}</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-500">
              <span className="font-semibold text-dark">{daysBetween(trip.start_date, trip.end_date)}</span> days
            </span>
          </div>
        )}

        {/* Loading skeletons */}
        {isLoading ? (
          <div className="space-y-4">
            {[0, 1, 2].map(i => <SectionSkeleton key={i} />)}
          </div>
        ) : (
          <>
            {/* Section cards */}
            <div className="space-y-4">
              {sections.map((section, i) => (
                <div
                  key={section.id}
                  draggable
                  onDragStart={() => handleDragStart(i)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(i)}
                  onDragEnd={() => setDragIndex(null)}
                  className="transition-opacity duration-200"
                  style={{
                    animation: 'fadeIn 0.2s ease-out both',
                    borderTop: dragIndex !== null && dragIndex !== i ? '2px solid transparent' : undefined,
                  }}
                >
                  <SectionCard
                    index={i}
                    data={section}
                    onChange={handleChange}
                    onRemove={handleRemove}
                    showRemove={sections.length > 1}
                    tripStartDate={trip?.start_date}
                    tripEndDate={trip?.end_date}
                    errors={errors[i] || {}}
                    isDragging={dragIndex === i}
                  />
                </div>
              ))}
            </div>

            {/* Add section */}
            <button
              type="button"
              onClick={handleAddSection}
              className="w-full mt-4 border-2 border-dashed border-primary/30 text-primary font-semibold
                text-sm py-3 rounded-xl hover:border-primary hover:bg-teal-50 transition
                flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Add another Section
            </button>
          </>
        )}
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-50
        px-4 sm:px-6 py-3">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Budget info */}
          <div>
            <p className="text-base font-semibold text-dark">
              Total Budget: <span className="text-primary">₹{totalBudget.toLocaleString('en-IN')}</span>
            </p>
            <p className="text-xs text-slate-400">{sections.length} section{sections.length !== 1 ? 's' : ''}</p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => navigate('/my-trips')}
              className="text-sm text-slate-400 hover:text-primary hover:underline transition px-2"
            >
              Skip for Now
            </button>
            <button
              type="button"
              disabled={isSaving || isLoading}
              onClick={handleSave}
              className="flex-1 sm:flex-none bg-primary hover:bg-teal-700 text-white font-semibold
                px-6 py-2.5 rounded-xl transition flex items-center justify-center gap-2
                disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Saving...
                </>
              ) : 'Save Itinerary'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
