import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, SlidersHorizontal, ChevronDown, Plane } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabaseClient'
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
  const [profile, setProfile] = useState(null)
  const [cities, setCities] = useState([])
  const [trips, setTrips] = useState([])
  const [citiesLoading, setCitiesLoading] = useState(true)
  const [tripsLoading, setTripsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

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
    if (data.success) setTrips(data.trips)
    else toast.error('Failed to load trips')
    setTripsLoading(false)
  }, [])

  useEffect(() => { loadTrips() }, [loadTrips])

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
    if (searchQuery.trim()) navigate(`/explore?q=${encodeURIComponent(searchQuery)}`)
  }

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
          <SectionHeading title="Top Regional Selections" ctaLabel="View all" onCta={() => navigate('/explore')} />
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {citiesLoading
              ? Array.from({ length: 5 }).map((_, i) => <CityCardSkeleton key={i} />)
              : cities.map((city, i) => (
                  <CityCard key={city.id} {...city} index={i} />
                ))}
          </div>
        </section>

        {/* Previous Trips */}
        <section>
          <SectionHeading
            title="Previous Trips"
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
              {trips.map((trip, i) => (
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
