import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Clock, Tag, DollarSign, Calendar } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import Navbar from '../components/Navbar'
import EmptyState from '../components/EmptyState'

const API = import.meta.env.VITE_API_URL

async function getToken() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token
}

function fmt(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const CATEGORY_COLORS = {
  Sightseeing: 'bg-blue-50 text-blue-600 border-blue-200',
  Food:        'bg-orange-50 text-orange-600 border-orange-200',
  Adventure:   'bg-green-50 text-green-600 border-green-200',
  Shopping:    'bg-purple-50 text-purple-600 border-purple-200',
  Transport:   'bg-slate-50 text-slate-600 border-slate-200',
  Other:       'bg-teal-50 text-teal-600 border-teal-200',
}

export default function ViewItinerary() {
  const { tripId } = useParams()
  const navigate = useNavigate()

  const [trip, setTrip]           = useState(null)
  const [sections, setSections]   = useState([])
  const [activities, setActivities] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound]   = useState(false)

  useEffect(() => {
    const load = async () => {
      const token = await getToken()
      if (!token) { navigate('/login'); return }

      const [tripRes, secRes, actRes] = await Promise.all([
        fetch(`${API}/api/trips/${tripId}`,          { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/trips/${tripId}/sections`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/itinerary/${tripId}/activities`, { headers: { Authorization: `Bearer ${token}` } }),
      ])

      const tripData = await tripRes.json()
      const secData  = await secRes.json()
      const actData  = await actRes.json()

      if (!tripData.success) { setNotFound(true); setIsLoading(false); return }
      setTrip(tripData.trip)
      if (secData.success) setSections(secData.sections)
      if (actData.success) setActivities(actData.activities)
      setIsLoading(false)
    }
    load()
  }, [tripId, navigate])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
          {[0,1,2].map(i => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 p-5 animate-pulse space-y-3">
              <div className="h-4 w-32 bg-slate-100 rounded" />
              <div className="h-3 w-48 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-16">
          <EmptyState icon={MapPin} message="Trip not found or you don't have access."
            ctaLabel="Go to My Trips" onCta={() => navigate('/my-trips')} />
        </div>
      </div>
    )
  }

  const totalBudget = sections.reduce((s, sec) => s + (parseFloat(sec.budget) || 0), 0)

  return (
    <div className="min-h-screen bg-background pb-16">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 fade-in">

        {/* Back + Edit */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate('/my-trips')}
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
            <ArrowLeft size={15} /> My Trips
          </button>
          <button onClick={() => navigate(`/itinerary-builder/${tripId}`)}
            className="text-sm font-semibold border-2 border-primary text-primary px-3 py-1.5 rounded-xl hover:bg-teal-50 transition">
            Edit Itinerary
          </button>
        </div>

        {/* Trip header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-dark">{trip?.name}</h1>
          <p className="text-sm text-slate-400 mt-1 flex items-center gap-1.5">
            <Calendar size={13} /> {fmt(trip?.start_date)} → {fmt(trip?.end_date)}
          </p>
        </div>

        {sections.length === 0 ? (
          <EmptyState icon={MapPin} message="No itinerary saved yet."
            ctaLabel="Build Itinerary" onCta={() => navigate(`/itinerary-builder/${tripId}`)} />
        ) : (
          <div className="space-y-5">
            {sections.map((sec, i) => {
              const sectionActivities = activities.filter(a => a.stop_id === sec.id)
              return (
                <div key={sec.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  {/* Section header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-dark text-sm">
                          {sec.description || `Section ${i + 1}`}
                        </p>
                        {(sec.start_date || sec.end_date) && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {fmt(sec.start_date)} {sec.end_date ? `→ ${fmt(sec.end_date)}` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                    {sec.budget > 0 && (
                      <span className="text-xs font-semibold text-primary bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-full">
                        ₹{parseFloat(sec.budget).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  {/* Activities */}
                  {sectionActivities.length === 0 ? (
                    <p className="text-xs text-slate-400 px-5 py-4">No activities added.</p>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {sectionActivities.map(act => (
                        <div key={act.id} className="px-5 py-3 flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-dark text-sm">{act.name}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium
                                ${CATEGORY_COLORS[act.category] || CATEGORY_COLORS.Other}`}>
                                {act.category}
                              </span>
                              {act.is_paid && (
                                <span className="text-xs px-2 py-0.5 rounded-full border bg-green-50 text-green-600 border-green-200 font-medium">
                                  Paid
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              {act.activity_time && (
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                  <Clock size={11} /> {act.activity_time.slice(0, 5)}
                                </span>
                              )}
                              {act.location_name && (
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                  <MapPin size={11} /> {act.location_name}
                                </span>
                              )}
                              {act.duration_minutes && (
                                <span className="text-xs text-slate-400">{act.duration_minutes} min</span>
                              )}
                            </div>
                            {act.description && (
                              <p className="text-xs text-slate-400 mt-1">{act.description}</p>
                            )}
                          </div>
                          {act.cost > 0 && (
                            <span className="text-sm font-semibold text-dark whitespace-nowrap">
                              {act.currency} {parseFloat(act.cost).toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Total budget */}
            {totalBudget > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-dark">Total Budget</span>
                <span className="text-base font-bold text-primary">₹{totalBudget.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
