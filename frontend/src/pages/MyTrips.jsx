import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, SlidersHorizontal, Plus, Plane, CheckCircle, Clock, MapPin, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabaseClient'
import Navbar from '../components/Navbar'
import TripCard, { TripCardSkeleton } from '../components/TripCard'
import EmptyState from '../components/EmptyState'

const API = import.meta.env.VITE_API_URL

async function getToken() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token
}

const today = new Date().toISOString().split('T')[0]

/** Derive status from dates regardless of stored value */
function deriveStatus(trip) {
  if (!trip.start_date || !trip.end_date) return trip.status || 'upcoming'
  if (trip.end_date < today) return 'completed'
  if (trip.start_date <= today && trip.end_date >= today) return 'ongoing'
  return 'upcoming'
}

const SECTIONS = [
  {
    key: 'ongoing',
    label: 'Ongoing',
    icon: Clock,
    color: 'text-accent',
    badge: 'bg-orange-50 text-orange-600 border border-orange-200',
    empty: 'No ongoing trips right now.',
  },
  {
    key: 'upcoming',
    label: 'Upcoming',
    icon: Plane,
    color: 'text-blue-500',
    badge: 'bg-blue-50 text-blue-600 border border-blue-200',
    empty: 'No upcoming trips planned.',
  },
  {
    key: 'completed',
    label: 'Completed',
    icon: CheckCircle,
    color: 'text-green-500',
    badge: 'bg-green-50 text-green-600 border border-green-200',
    empty: 'No completed trips yet.',
  },
]

const SORT_OPTIONS = [
  { value: 'date_asc',  label: 'Date (Earliest)' },
  { value: 'date_desc', label: 'Date (Latest)' },
  { value: 'name_asc',  label: 'Name (A–Z)' },
  { value: 'name_desc', label: 'Name (Z–A)' },
  { value: 'duration',  label: 'Duration' },
]

function sortTrips(trips, sortBy) {
  return [...trips].sort((a, b) => {
    switch (sortBy) {
      case 'date_asc':  return (a.start_date || '') > (b.start_date || '') ? 1 : -1
      case 'date_desc': return (a.start_date || '') < (b.start_date || '') ? 1 : -1
      case 'name_asc':  return a.name.localeCompare(b.name)
      case 'name_desc': return b.name.localeCompare(a.name)
      case 'duration': {
        const da = a.start_date && a.end_date ? new Date(a.end_date) - new Date(a.start_date) : 0
        const db = b.start_date && b.end_date ? new Date(b.end_date) - new Date(b.start_date) : 0
        return db - da
      }
      default: return 0
    }
  })
}

/** Inline confirm delete dialog */
function DeleteConfirm({ tripName, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full fade-in">
        <h3 className="text-base font-bold text-dark mb-2">Delete Trip?</h3>
        <p className="text-sm text-slate-500 mb-5">
          Are you sure you want to delete <span className="font-semibold text-dark">"{tripName}"</span>?
          This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 border border-slate-200 text-slate-500 font-semibold py-2.5 rounded-xl hover:bg-slate-50 transition disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition
              flex items-center justify-center gap-2 disabled:opacity-50">
            {loading
              ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MyTrips() {
  const navigate = useNavigate()
  const [trips, setTrips]           = useState([])
  const [isLoading, setIsLoading]   = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy]         = useState('date_asc')
  const [sortOpen, setSortOpen]     = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null) // { id, name }
  const [deleting, setDeleting]     = useState(false)

  const loadTrips = useCallback(async () => {
    setIsLoading(true)
    const token = await getToken()
    const res = await fetch(`${API}/api/trips?limit=all`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    if (!data.success) { toast.error('Failed to load trips'); setIsLoading(false); return }
    // Attach derived status
    setTrips(data.trips.map(t => ({ ...t, status: deriveStatus(t) })))
    setIsLoading(false)
  }, [])

  useEffect(() => { loadTrips() }, [loadTrips])

  // Filter + sort
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return trips.filter(t =>
      !q || t.name.toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q)
    )
  }, [trips, searchQuery])

  const grouped = useMemo(() => {
    const map = { ongoing: [], upcoming: [], completed: [] }
    filtered.forEach(t => { map[t.status]?.push(t) })
    return {
      ongoing:   sortTrips(map.ongoing,   sortBy),
      upcoming:  sortTrips(map.upcoming,  sortBy),
      completed: sortTrips(map.completed, sortBy),
    }
  }, [filtered, sortBy])

  const totalCount = trips.length

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const token = await getToken()
    const res = await fetch(`${API}/api/trips/${deleteTarget.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    setDeleting(false)
    setDeleteTarget(null)
    if (!data.success) { toast.error(data.message || 'Delete failed'); return }
    toast.success('Trip deleted')
    loadTrips()
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {deleteTarget && (
        <DeleteConfirm
          tripName={deleteTarget.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}

      {/* Page header */}
      <div className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-dark">My Trips</h1>
              <p className="text-sm text-slate-400 mt-0.5">
                {totalCount} trip{totalCount !== 1 ? 's' : ''} total
              </p>
            </div>

            {/* Search + controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search trips..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl outline-none
                    focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white w-48 sm:w-56"
                />
              </div>

              {/* Sort dropdown */}
              <div className="relative">
                <button
                  onClick={() => setSortOpen(o => !o)}
                  className="flex items-center gap-1.5 text-sm border border-slate-200 rounded-xl px-3 py-2
                    hover:border-primary hover:text-primary transition bg-white"
                >
                  <SlidersHorizontal size={14} />
                  Sort
                  <ChevronDown size={13} className={`transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
                </button>
                {sortOpen && (
                  <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl border border-slate-100
                    shadow-lg z-20 py-1 fade-in">
                    {SORT_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => { setSortBy(opt.value); setSortOpen(false) }}
                        className={`w-full text-left px-4 py-2 text-sm transition
                          ${sortBy === opt.value ? 'text-primary font-semibold bg-teal-50' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* New trip */}
              <button
                onClick={() => navigate('/create-trip')}
                className="flex items-center gap-1.5 bg-primary hover:bg-teal-700 text-white
                  text-sm font-semibold px-4 py-2 rounded-xl transition"
              >
                <Plus size={15} /> New Trip
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 fade-in">

        {isLoading ? (
          // Skeleton
          <div className="space-y-10">
            {SECTIONS.map(s => (
              <section key={s.key}>
                <div className="h-5 w-32 bg-slate-100 rounded animate-pulse mb-4" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[0,1,2].map(i => <TripCardSkeleton key={i} />)}
                </div>
              </section>
            ))}
          </div>
        ) : totalCount === 0 ? (
          // Completely empty
          <EmptyState
            icon={Plane}
            message="You haven't planned any trips yet. Start your first adventure!"
            ctaLabel="+ Plan a Trip"
            onCta={() => navigate('/create-trip')}
          />
        ) : (
          SECTIONS.map(({ key, label, icon: Icon, color, badge, empty }) => (
            <section key={key}>
              {/* Section heading */}
              <div className="flex items-center gap-2 mb-4">
                <Icon size={18} className={color} />
                <h2 className="text-base font-bold text-dark">{label}</h2>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge}`}>
                  {grouped[key].length}
                </span>
              </div>

              {grouped[key].length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 px-6 py-8 text-center">
                  <p className="text-sm text-slate-400">{empty}</p>
                  {key === 'upcoming' && (
                    <button
                      onClick={() => navigate('/create-trip')}
                      className="mt-3 text-sm text-primary font-semibold hover:underline"
                    >
                      + Plan a trip
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {grouped[key].map((trip, i) => (
                    <TripCard
                      key={trip.id}
                      {...trip}
                      index={i}
                      onView={id => navigate(`/itinerary-builder/${id}`)}
                      onEdit={id => navigate(`/create-trip?edit=${id}`)}
                      onDelete={id => setDeleteTarget({ id, name: trip.name })}
                    />
                  ))}
                </div>
              )}
            </section>
          ))
        )}
      </div>

      {/* Floating plan button — mobile */}
      <button
        onClick={() => navigate('/create-trip')}
        className="fixed bottom-6 right-6 lg:hidden bg-accent hover:bg-orange-600 text-white
          font-semibold text-sm px-5 py-3 rounded-2xl shadow-lg shadow-orange-200 transition
          flex items-center gap-2 z-40"
      >
        <Plus size={16} /> Plan New Trip
      </button>
    </div>
  )
}
