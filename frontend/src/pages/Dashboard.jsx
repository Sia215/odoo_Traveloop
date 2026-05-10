import { useEffect, useState, useCallback } from 'react'
import { useNavigate, Navigate, useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, ChevronDown, Plane, Wallet } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabaseClient'
import { useUser } from '../context/UserContext'
import Navbar from '../components/Navbar'
import SectionHeading from '../components/SectionHeading'
import EmptyState from '../components/EmptyState'
import CityCard, { CityCardSkeleton } from '../components/CityCard'
import TripCard, { TripCardSkeleton } from '../components/TripCard'

const API = import.meta.env.VITE_API_URL

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  return { Authorization: `Bearer ${session?.access_token}` }
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user: ctxUser } = useUser()
  const isAdminExit = searchParams.get('exit') === '1'
  const [profile, setProfile] = useState(null)
  const [cities, setCities] = useState([])
  const [trips, setTrips] = useState([])
  const [citiesLoading, setCitiesLoading] = useState(true)
  const [tripsLoading, setTripsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [budgets, setBudgets] = useState([]) // [{ tripId, name, total }]

  // Load profile
  useEffect(() => {
    const load = async () => {
      const headers = await authHeaders()
      const res = await fetch(`${API}/api/auth/me`, { headers })
      const data = await res.json()
      if (data.success) setProfile(data.user)
    }
    load()
  }, [])

  // Load popular cities
  useEffect(() => {
    const load = async () => {
      setCitiesLoading(true)
      const res = await fetch(`${API}/api/cities/popular`)
      const data = await res.json()
      if (data.success) setCities(data.cities)
      else toast.error('Failed to load cities')
      setCitiesLoading(false)
    }
    load()
  }, [])

  // Load trips
  const loadTrips = useCallback(async () => {
    setTripsLoading(true)
    const headers = await authHeaders()
    const res = await fetch(`${API}/api/trips?limit=6`, { headers })
    const data = await res.json()
    if (data.success) {
      const today = new Date().toISOString().split('T')[0]
      setTrips(data.trips.map(t => ({
        ...t,
        status: !t.start_date || !t.end_date
          ? (t.status || 'upcoming')
          : t.end_date < today
            ? 'completed'
            : t.start_date <= today && t.end_date >= today
              ? 'ongoing'
              : 'upcoming',
      })))
    } else toast.error('Failed to load trips')
    setTripsLoading(false)
  }, [])

  useEffect(() => { loadTrips() }, [loadTrips])

  // Load budget overview from sections
  useEffect(() => {
    const load = async () => {
      const headers = await authHeaders()
      const res = await fetch(`${API}/api/trips?limit=all`, { headers })
      const data = await res.json()
      if (!data.success) return
      const today = new Date().toISOString().split('T')[0]
      const activeTrips = data.trips.filter(t => !t.end_date || t.end_date >= today)
      const results = await Promise.all(
        activeTrips.map(async t => {
          const r = await fetch(`${API}/api/trips/${t.id}/sections`, { headers })
          const d = await r.json()
          const total = d.success
            ? d.sections.reduce((sum, s) => sum + (parseFloat(s.budget) || 0), 0)
            : 0
          return { tripId: t.id, name: t.name, total }
        })
      )
      setBudgets(results.filter(b => b.total > 0))
    }
    load()
  }, [])

  const handleDeleteTrip = async (id) => {
    if (!window.confirm('Delete this trip?')) return
    const headers = await authHeaders()
    const res = await fetch(`${API}/api/trips/${id}`, { method: 'DELETE', headers })
    const data = await res.json()
    if (data.success) {
      toast.success('Trip deleted')
      loadTrips()
    } else {
      toast.error(data.message || 'Delete failed')
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) navigate(`/activities?q=${encodeURIComponent(searchQuery)}`)
  }

  if (ctxUser?.role === 'admin' && !isAdminExit) return <Navigate to="/admin" replace />

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Banner */}
      <div className="relative h-72 sm:h-80 bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-400 overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10" />
        <div className="absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-white/10" />

        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 drop-shadow">
            Where do you want to go?
          </h1>
          <p className="text-teal-100 text-sm mb-6">Discover your next adventure</p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="w-full max-w-2xl">
            <div className="flex items-center bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="flex items-center gap-2 flex-1 px-4">
                <Search size={18} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search destinations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 py-3.5 text-sm text-dark placeholder-slate-400 outline-none bg-transparent"
                />
              </div>
              <div className="hidden sm:flex items-center gap-1 px-3 border-l border-slate-100">
                <span className="text-xs text-slate-400">Group by</span>
                <ChevronDown size={14} className="text-slate-400" />
              </div>
              <div className="hidden sm:flex items-center gap-1 px-3 border-l border-slate-100">
                <SlidersHorizontal size={14} className="text-slate-400" />
                <span className="text-xs text-slate-400">Filter</span>
              </div>
              <button
                type="submit"
                className="bg-primary hover:bg-teal-700 text-white text-sm font-semibold px-5 py-3.5 transition"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 fade-in">

        {/* Welcome row */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-dark">
              Welcome back, {profile?.first_name ?? '...'}! 👋
            </h2>
            <p className="text-slate-400 text-sm mt-0.5">Ready to plan your next adventure?</p>
          </div>
          <button
            onClick={() => navigate('/create-trip')}
            className="flex items-center gap-2 bg-accent hover:bg-orange-600 text-white font-semibold
              text-sm px-4 py-2.5 rounded-xl transition shadow-sm shadow-orange-100"
          >
            <span className="text-base leading-none">+</span> Plan a Trip
          </button>
        </div>

        {/* Top Regional Selections */}
        <section>
          <SectionHeading title="Top Regional Selections" ctaLabel="View all" onCta={() => navigate('/activities')} />
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {citiesLoading
              ? Array.from({ length: 5 }).map((_, i) => <CityCardSkeleton key={i} />)
              : cities.map((city, i) => (
                  <CityCard key={city.id} {...city} index={i} />
                ))}
          </div>
        </section>

        {/* Budget Overview */}
        {budgets.length > 0 && (
          <section>
            <SectionHeading title="Budget Overview" ctaLabel="View all trips" onCta={() => navigate('/trips')} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {budgets.map(b => (
                <div key={b.tripId} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                    <Wallet size={18} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400 truncate">{b.name}</p>
                    <p className="text-base font-bold text-dark">₹{b.total.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Trips */}
        <section>
          <SectionHeading
            title="Upcoming Trips"
            ctaLabel="View all"
            onCta={() => navigate('/trips')}
          />
          {tripsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => <TripCardSkeleton key={i} />)}
            </div>
          ) : trips.length === 0 ? (
            <EmptyState
              icon={Plane}
              message="No trips yet. Plan your first one!"
              ctaLabel="+ Plan a Trip"
              onCta={() => navigate('/create-trip')}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {trips.filter(t => t.status !== 'completed').map((trip, i) => (
                <TripCard
                  key={trip.id}
                  {...trip}
                  index={i}
                  onView={(id) => navigate(`/itinerary-builder/${id}`)}
                  onEdit={(id) => navigate(`/create-trip?edit=${id}`)}
                  onDelete={handleDeleteTrip}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
