import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Search, X, Image } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabaseClient'
import { fetchPlacePhoto } from '../lib/unsplash'
import Navbar from '../components/Navbar'
import InputField from '../components/InputField'
import ActivitySuggestionCard, { ActivitySuggestionSkeleton } from '../components/ActivitySuggestionCard'

const API = import.meta.env.VITE_API_URL
const today = new Date().toISOString().split('T')[0]

async function getToken() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token
}

export default function CreateTrip() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', start_date: '', end_date: '', description: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  // City search
  const [cityQuery, setCityQuery] = useState('')
  const [cityResults, setCityResults] = useState([])
  const [selectedCity, setSelectedCity] = useState(null)
  const [cityDropdown, setCityDropdown] = useState(false)
  const cityRef = useRef()
  const debounceRef = useRef()

  // Cover photo
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const coverInputRef = useRef()

  // Activities
  const [activities, setActivities] = useState([])
  const [activitiesLoading, setActivitiesLoading] = useState(true)
  const [selectedActivities, setSelectedActivities] = useState([])

  // Load suggestions
  useEffect(() => {
    fetch(`${API}/api/activities/suggestions?limit=6`)
      .then(r => r.json())
      .then(d => { if (d.success) setActivities(d.activities) })
      .finally(() => setActivitiesLoading(false))
  }, [])

  // Auto-fetch city photo from Unsplash when city is selected
  useEffect(() => {
    if (selectedCity && !coverFile) {
      fetchPlacePhoto(`${selectedCity.name} ${selectedCity.country}`).then(url => {
        if (url) setCoverPreview(url)
      })
    }
  }, [selectedCity])

  // City search debounce
  useEffect(() => {
    if (!cityQuery.trim()) { setCityResults([]); return }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`${API}/api/cities/search?q=${encodeURIComponent(cityQuery)}`)
      const data = await res.json()
      if (data.success) { setCityResults(data.cities); setCityDropdown(true) }
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [cityQuery])

  // Close city dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (cityRef.current && !cityRef.current.contains(e.target)) setCityDropdown(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleCoverChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  const uploadCover = async () => {
    if (!coverFile) return null
    try {
      const ext = coverFile.name.split('.').pop().toLowerCase()
      const path = `trip-covers/${Date.now()}.${ext}`
      const { error } = await supabase.storage
        .from('avatars')
        .upload(path, coverFile, { upsert: true, contentType: coverFile.type })
      if (error) {
        console.error('Cover upload error:', error)
        toast.error('Cover photo upload failed: ' + error.message)
        return null
      }
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      return data.publicUrl
    } catch (err) {
      console.error('Cover upload exception:', err)
      return null
    }
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim() || form.name.trim().length < 3) e.name = 'Trip name must be at least 3 characters'
    if (!selectedCity) e.city = 'Please select a destination'
    if (!form.start_date) e.start_date = 'Start date is required'
    else if (form.start_date < today) e.start_date = 'Start date cannot be in the past'
    if (!form.end_date) e.end_date = 'End date is required'
    else if (form.end_date <= form.start_date) e.end_date = 'End date must be after start date'
    return e
  }

  const handleSubmit = async (isDraft = false) => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)

    const token = await getToken()
    // If user uploaded a file, upload it. Otherwise use the auto-fetched preview URL.
    const cover_photo = coverFile ? await uploadCover() : (coverPreview || null)

    const res = await fetch(`${API}/api/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: form.name,
        place_id: selectedCity?.id,
        start_date: form.start_date,
        end_date: form.end_date,
        description: form.description,
        cover_photo,
        status: isDraft ? 'upcoming' : 'upcoming',
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!data.success) { toast.error(data.message || 'Failed to create trip'); return }

    toast.success(isDraft ? 'Trip saved as draft!' : 'Trip created!')
    if (isDraft) navigate('/dashboard')
    else navigate(`/itinerary-builder/${data.trip.id}`)
  }

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 fade-in">
        <h1 className="text-2xl font-bold text-primary mb-6">Plan a New Trip</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* LEFT — Form */}
          <div className="lg:w-[55%] space-y-5">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">

              <InputField
                label="Trip Name"
                id="name"
                placeholder="e.g. Summer Europe Adventure"
                value={form.name}
                onChange={set('name')}
                error={errors.name}
              />

              {/* City search */}
              <div className="flex flex-col gap-1" ref={cityRef}>
                <label className="text-sm font-medium text-dark">Select a Place</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {selectedCity ? <MapPin size={17} className="text-primary" /> : <Search size={17} />}
                  </span>
                  <input
                    type="text"
                    placeholder="Search destinations..."
                    value={selectedCity ? selectedCity.name : cityQuery}
                    onChange={(e) => { setSelectedCity(null); setCityQuery(e.target.value) }}
                    onFocus={() => cityResults.length && setCityDropdown(true)}
                    className={`w-full rounded-xl border px-4 py-2.5 pl-10 pr-8 text-sm text-dark
                      placeholder-slate-400 outline-none transition
                      focus:ring-2 focus:ring-primary/30 focus:border-primary
                      ${errors.city ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white hover:border-slate-300'}
                      ${selectedCity ? 'text-primary font-medium' : ''}`}
                  />
                  {selectedCity && (
                    <button type="button" onClick={() => { setSelectedCity(null); setCityQuery('') }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X size={15} />
                    </button>
                  )}
                  {cityDropdown && cityResults.length > 0 && (
                    <div className="absolute z-20 top-full mt-1 w-full bg-white rounded-xl border border-slate-100 shadow-lg overflow-hidden">
                      {cityResults.map((city) => (
                        <button
                          key={city.id}
                          type="button"
                          onClick={() => { setSelectedCity(city); setCityQuery(''); setCityDropdown(false) }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-dark hover:bg-teal-50 transition text-left"
                        >
                          <MapPin size={14} className="text-primary shrink-0" />
                          <span>{city.name}</span>
                          <span className="text-slate-400 text-xs ml-auto">{city.country}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {errors.city && <p className="text-xs text-red-500">{errors.city}</p>}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-dark">Start Date</label>
                  <input type="date" min={today} value={form.start_date}
                    onChange={set('start_date')}
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm text-dark outline-none transition
                      focus:ring-2 focus:ring-primary/30 focus:border-primary
                      ${errors.start_date ? 'border-red-400 bg-red-50' : 'border-slate-200 hover:border-slate-300'}`}
                  />
                  {errors.start_date && <p className="text-xs text-red-500">{errors.start_date}</p>}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-dark">End Date</label>
                  <input type="date" min={form.start_date || today} value={form.end_date}
                    onChange={set('end_date')}
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm text-dark outline-none transition
                      focus:ring-2 focus:ring-primary/30 focus:border-primary
                      ${errors.end_date ? 'border-red-400 bg-red-50' : 'border-slate-200 hover:border-slate-300'}`}
                  />
                  {errors.end_date && <p className="text-xs text-red-500">{errors.end_date}</p>}
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-dark">
                  Trip Description <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea rows={3} placeholder="What's this trip about?"
                  value={form.description} onChange={set('description')}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-dark
                    placeholder-slate-400 outline-none resize-none transition
                    hover:border-slate-300 focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>

              {/* Cover photo */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-dark">
                  Cover Photo <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <div className="flex items-center gap-4">
                  <div
                    onClick={() => coverInputRef.current.click()}
                    className="w-20 h-20 rounded-xl border-2 border-dashed border-primary/30 bg-teal-50
                      hover:border-primary hover:bg-teal-100 transition cursor-pointer overflow-hidden flex items-center justify-center"
                  >
                    {coverPreview
                      ? <img src={coverPreview} alt="cover" className="w-full h-full object-cover" />
                      : <span className="text-2xl">🖼️</span>}
                  </div>
                  <div>
                    <button type="button" onClick={() => coverInputRef.current.click()}
                      className="text-sm text-primary font-medium hover:underline">
                      {coverPreview ? 'Change photo' : 'Upload cover photo'}
                    </button>
                    <p className="text-xs text-slate-400 mt-0.5">JPG, PNG up to 5MB</p>
                  </div>
                  <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSubmit(false)}
                  className="flex-1 bg-primary hover:bg-teal-700 text-white font-semibold py-2.5 rounded-xl
                    transition flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : 'Save & Continue →'}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSubmit(true)}
                  className="flex-1 border-2 border-primary text-primary font-semibold py-2.5 rounded-xl
                    hover:bg-teal-50 transition disabled:opacity-60"
                >
                  Save as Draft
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT — Suggestions */}
          <div className="lg:w-[45%]">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-base font-bold text-dark mb-1">Suggested Places & Activities</h2>
              <p className="text-xs text-slate-400 mb-4">Click any card to add it to your trip</p>
              <div className="grid grid-cols-2 gap-3">
                {activitiesLoading
                  ? Array.from({ length: 6 }).map((_, i) => <ActivitySuggestionSkeleton key={i} />)
                  : activities.map((a, i) => (
                      <ActivitySuggestionCard
                        key={a.id}
                        {...a}
                        index={i}
                        isSelected={selectedActivities.includes(a.id)}
                        onToggle={(id) => setSelectedActivities(prev =>
                          prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                        )}
                      />
                    ))}
              </div>
              {selectedActivities.length > 0 && (
                <p className="text-xs text-primary font-medium mt-4 text-center">
                  {selectedActivities.length} activit{selectedActivities.length > 1 ? 'ies' : 'y'} selected
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
