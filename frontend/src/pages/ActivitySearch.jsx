import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, ArrowRight, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import Navbar from '../components/Navbar'
import ActivityCard from '../components/ActivityCard'
import ActivityFilterBar from '../components/ActivityFilterBar'
import EmptyState from '../components/EmptyState'
import { useToast } from '../hooks/useToast'

const API = import.meta.env.VITE_API_URL
const LIMIT = 12

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  return { Authorization: `Bearer ${session?.access_token}` }
}

function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 animate-pulse">
      <div className="h-40 bg-slate-100" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-slate-100 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-full" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
        <div className="h-8 bg-slate-100 rounded-xl mt-2" />
      </div>
    </div>
  )
}

export default function ActivitySearch() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { showToast } = useToast()

  const [activities, setActivities]       = useState([])
  const [total, setTotal]                 = useState(0)
  const [page, setPage]                   = useState(1)
  const [isLoading, setIsLoading]         = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [filters, setFilters]             = useState({
    search: '', category: '', city: searchParams.get('city') || '',
    min_cost: '', max_cost: '', max_duration: '', sort: '',
  })
  const [categories, setCategories]       = useState([])
  const [cities, setCities]               = useState([])
  const [trips, setTrips]                 = useState([])
  const [tripsLoading, setTripsLoading]   = useState(true)
  const [selectedTripId, setSelectedTripId] = useState('')
  const [addedActivityIds, setAddedActivityIds] = useState(new Set())
  const [trayVisible, setTrayVisible]     = useState(false)

  const debounceRef   = useRef(null)
  const firstNewRef   = useRef(null)
  const filtersRef    = useRef(filters)
  filtersRef.current  = filters

  // ── Initial parallel fetch ──────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const headers = await authHeaders()
      const [catRes, citRes, tripsRes] = await Promise.all([
        fetch(`${API}/api/activities/categories`),
        fetch(`${API}/api/activities/cities`),
        fetch(`${API}/api/trips`, { headers }),
      ])
      const [catData, citData, tripsData] = await Promise.all([
        catRes.json(), citRes.json(), tripsRes.json(),
      ])
      if (catData.categories)  setCategories(catData.categories)
      if (citData.cities)      setCities(citData.cities)
      if (tripsData.success && tripsData.trips?.length) {
        setTrips(tripsData.trips)
        setSelectedTripId(tripsData.trips[0].id)
      }
      setTripsLoading(false)
    }
    init()
  }, [])

  // ── Fetch added activities when trip changes ────────────────────────────────
  useEffect(() => {
    if (!selectedTripId) return
    const load = async () => {
      const headers = await authHeaders()
      const res  = await fetch(`${API}/api/trips/${selectedTripId}/activities`, { headers })
      const data = await res.json()
      if (data.activities) {
        setAddedActivityIds(new Set(data.activities.map(a => a.activity_id ?? a.id)))
      }
    }
    load()
  }, [selectedTripId])

  // ── Fetch activities ────────────────────────────────────────────────────────
  const fetchActivities = useCallback(async (currentFilters, currentPage, append = false) => {
    if (append) setIsLoadingMore(true)
    else        setIsLoading(true)

    const params = new URLSearchParams({ page: currentPage, limit: LIMIT })
    if (currentFilters.search)       params.set('search',       currentFilters.search)
    if (currentFilters.category)     params.set('category',     currentFilters.category)
    if (currentFilters.city)         params.set('city',         currentFilters.city)
    if (currentFilters.min_cost)     params.set('min_cost',     currentFilters.min_cost)
    if (currentFilters.max_cost)     params.set('max_cost',     currentFilters.max_cost)
    if (currentFilters.max_duration) params.set('max_duration', currentFilters.max_duration)
    if (currentFilters.sort)         params.set('sort',         currentFilters.sort)

    try {
      const res  = await fetch(`${API}/api/activities?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setTotal(data.total ?? 0)
      if (append) {
        setActivities(prev => {
          const next = [...prev, ...(data.activities ?? [])]
          // scroll to first new card after render
          setTimeout(() => firstNewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100)
          return next
        })
      } else {
        setActivities(data.activities ?? [])
      }
    } catch {
      showToast('Failed to load activities. Please try again.', 'error')
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [showToast])

  // ── Debounce filter changes → reset to page 1 ──────────────────────────────
  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
      fetchActivities(filters, 1, false)
    }, 400)
    return () => clearTimeout(debounceRef.current)
  }, [filters]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load more ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (page === 1) return
    fetchActivities(filtersRef.current, page, true)
  }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Tray animation ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (addedActivityIds.size > 0) setTrayVisible(true)
  }, [addedActivityIds.size])

  // ── Add / Remove ────────────────────────────────────────────────────────────
  const handleAdd = async (activityId) => {
    if (!selectedTripId) { showToast('Please select a trip first', 'warning'); return }
    setAddedActivityIds(prev => new Set([...prev, activityId]))
    try {
      const headers = await authHeaders()
      const res = await fetch(`${API}/api/trips/${selectedTripId}/activities`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity_id: activityId }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message)
      showToast('Activity added!', 'success')
    } catch {
      setAddedActivityIds(prev => { const s = new Set(prev); s.delete(activityId); return s })
      showToast('Failed to add activity', 'error')
    }
  }

  const handleRemove = async (activityId) => {
    setAddedActivityIds(prev => { const s = new Set(prev); s.delete(activityId); return s })
    try {
      const headers = await authHeaders()
      const res = await fetch(`${API}/api/trips/${selectedTripId}/activities/${activityId}`, {
        method: 'DELETE', headers,
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message)
    } catch {
      setAddedActivityIds(prev => new Set([...prev, activityId]))
      showToast('Failed to remove activity', 'error')
    }
  }

  const clearFilters = () => setFilters({
    search: '', category: '', city: '',
    min_cost: '', max_cost: '', max_duration: '', sort: '',
  })

  const selectedTrip = trips.find(t => t.id === selectedTripId)
  const addedCount   = addedActivityIds.size

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      {/* Page header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-[#1E293B]">Explore Activities</h1>
            <p className="text-slate-400 text-sm mt-0.5">Find things to do on your next adventure</p>
          </div>
          {!isLoading && (
            <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full font-medium self-center">
              {total} {total === 1 ? 'activity' : 'activities'} found
            </span>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5"
           style={{ paddingBottom: addedCount > 0 ? '80px' : undefined }}>

        {/* Trip selector */}
        {tripsLoading ? null : trips.length > 0 ? (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-[#1E293B]">Adding to:</span>
            <select
              value={selectedTripId}
              onChange={e => setSelectedTripId(e.target.value)}
              className="h-10 px-3 text-sm rounded-xl border border-slate-200 bg-white text-[#1E293B] outline-none
                         focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] transition"
            >
              {trips.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.status})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-teal-50 border border-teal-100 rounded-xl px-4 py-3">
            <p className="text-sm text-[#1E293B] flex-1">Create a trip first to add activities to it.</p>
            <button
              onClick={() => navigate('/create-trip')}
              className="text-sm font-semibold text-white bg-[#0D9488] hover:bg-teal-700 px-4 py-2 rounded-xl transition"
            >
              + Create Trip
            </button>
          </div>
        )}

        {/* Filter bar */}
        <ActivityFilterBar
          filters={filters}
          onFilterChange={setFilters}
          categories={categories}
          cities={cities}
        />

        {/* Results grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: LIMIT }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : activities.length === 0 ? (
          <EmptyState
            icon={Search}
            message="No activities found for your filters."
            ctaLabel="Clear Filters"
            onCta={clearFilters}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {activities.map((activity, idx) => (
                <div
                  key={activity.id}
                  ref={idx === activities.length - LIMIT ? firstNewRef : null}
                >
                  <ActivityCard
                    {...activity}
                    isAdded={addedActivityIds.has(activity.id)}
                    onAdd={handleAdd}
                    onRemove={handleRemove}
                  />
                </div>
              ))}
            </div>

            {/* Load more / end */}
            <div className="pt-2 text-center">
              {activities.length < total ? (
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={isLoadingMore}
                  className="w-full max-w-xs border-2 border-[#0D9488] text-[#0D9488] font-semibold text-sm
                             py-2.5 rounded-xl hover:bg-teal-50 transition flex items-center justify-center gap-2 mx-auto
                             disabled:opacity-60"
                >
                  {isLoadingMore
                    ? <><span className="w-4 h-4 border-2 border-[#0D9488] border-t-transparent rounded-full animate-spin" />Loading...</>
                    : 'Load More Activities'
                  }
                </button>
              ) : (
                <p className="text-sm text-slate-400">Showing all {total} activities</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Sticky added-activities tray */}
      {trayVisible && addedCount > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between px-4 sm:px-8"
          style={{
            background: '#0D9488',
            height: '56px',
            animation: 'slideUp 200ms ease-out',
          }}
        >
          <span className="text-white text-sm font-medium flex items-center gap-2">
            <CheckCircle size={16} />
            {addedCount} {addedCount === 1 ? 'activity' : 'activities'} added
            {selectedTrip ? ` to ${selectedTrip.name}` : ''}
          </span>
          <button
            onClick={() => navigate(`/itinerary-builder/${selectedTripId}`)}
            className="flex items-center gap-1.5 text-sm font-semibold text-white border border-white/60
                       px-4 py-1.5 rounded-xl hover:bg-white/10 transition"
          >
            View Trip <ArrowRight size={15} />
          </button>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(56px); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
