import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, MapPin, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabaseClient'
import { useUser } from '../context/UserContext'
import Navbar from '../components/Navbar'
import ProfileForm from '../components/ProfileForm'
import TripGallery from '../components/TripGallery'

const API = import.meta.env.VITE_API_URL

async function getToken() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token
}

function ProfileSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-8 flex flex-col items-center gap-4 animate-pulse">
      <div className="w-24 h-24 rounded-full bg-slate-100" />
      <div className="h-4 w-40 bg-slate-100 rounded" />
      <div className="h-3 w-28 bg-slate-100 rounded" />
      <div className="flex gap-3">
        <div className="h-6 w-32 bg-slate-100 rounded-full" />
        <div className="h-6 w-28 bg-slate-100 rounded-full" />
      </div>
    </div>
  )
}

export default function Profile() {
  const navigate = useNavigate()
  const { setUser } = useUser()

  const [profile, setProfile] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [preplanned, setPreplanned] = useState([])
  const [previous, setPrevious] = useState([])
  const [errors, setErrors] = useState({})
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  // optimistic avatar for instant card update
  const [liveAvatarUrl, setLiveAvatarUrl] = useState(null)

  useEffect(() => {
    const load = async () => {
      const token = await getToken()
      if (!token) { navigate('/login'); return }

      const [profileRes, preplannedRes, previousRes] = await Promise.all([
        fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/trips?status=upcoming&limit=6`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/trips?status=completed&limit=6`, { headers: { Authorization: `Bearer ${token}` } }),
      ])

      const profileData    = await profileRes.json()
      const preplannedData = await preplannedRes.json()
      const previousData   = await previousRes.json()

      if (profileData.success) {
        setProfile(profileData.user)
        setLiveAvatarUrl(profileData.user.avatar_url)
        setFormData({
          first_name:      profileData.user.first_name      || '',
          last_name:       profileData.user.last_name       || '',
          phone:           profileData.user.phone           || '',
          city:            profileData.user.city            || '',
          country:         profileData.user.country         || '',
          additional_info: profileData.user.additional_info || '',
          avatar_url:      profileData.user.avatar_url      || '',
        })
      }
      setPreplanned(preplannedData.trips  || [])
      setPrevious(previousData.trips      || [])
      setIsLoading(false)
    }
    load()
  }, [navigate])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => { const e = { ...prev }; delete e[field]; return e })
  }

  const handleAvatarChange = (url) => {
    // Optimistic update — updates card instantly
    setLiveAvatarUrl(url)
    setFormData(prev => ({ ...prev, avatar_url: url }))
  }

  const validate = () => {
    const e = {}
    if (!formData.first_name?.trim() || formData.first_name.trim().length < 2)
      e.first_name = 'Min 2 characters'
    if (!formData.last_name?.trim() || formData.last_name.trim().length < 2)
      e.last_name = 'Min 2 characters'
    if (formData.phone && formData.phone.replace(/\D/g, '').length < 10)
      e.phone = 'Enter a valid phone number (min 10 digits)'
    return e
  }

  const handleSave = async () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    // Build only changed fields
    const payload = {}
    const fields = ['first_name','last_name','phone','city','country','additional_info','avatar_url']
    fields.forEach(f => { if (formData[f] !== (profile[f] ?? '')) payload[f] = formData[f] })

    if (Object.keys(payload).length === 0) {
      toast('No changes to save', { icon: 'ℹ️' })
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    const token = await getToken()
    const res = await fetch(`${API}/api/auth/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    setIsSaving(false)

    if (!data.success) { toast.error('Failed to update profile. Try again.'); return }

    const updated = data.profile
    setProfile(updated)
    setLiveAvatarUrl(updated.avatar_url)
    setUser(updated)   // sync Navbar instantly
    setIsEditing(false)
    toast.success('Profile updated successfully!')
  }

  const handleCancel = () => {
    setFormData({
      first_name:      profile.first_name      || '',
      last_name:       profile.last_name       || '',
      phone:           profile.phone           || '',
      city:            profile.city            || '',
      country:         profile.country         || '',
      additional_info: profile.additional_info || '',
      avatar_url:      profile.avatar_url      || '',
    })
    setLiveAvatarUrl(profile.avatar_url)
    setErrors({})
    setIsEditing(false)
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    const token = await getToken()
    const res = await fetch(`${API}/api/auth/profile`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    if (!data.success) { toast.error('Delete failed. Try again.'); setDeleting(false); return }
    await supabase.auth.signOut()
    navigate('/login')
  }

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : ''

  const initials = profile
    ? `${profile.first_name?.[0] ?? ''}${profile.last_name?.[0] ?? ''}`.toUpperCase()
    : '?'

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 fade-in space-y-6">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-dark">My Profile</h1>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border-2 transition
              ${isEditing
                ? 'border-slate-200 text-slate-500 hover:bg-slate-50'
                : 'border-primary text-primary hover:bg-teal-50'}`}
          >
            <Pencil size={14} />
            {isEditing ? 'Cancel Edit' : 'Edit Profile'}
          </button>
        </div>

        {/* Profile card */}
        {isLoading ? <ProfileSkeleton /> : profile && (
          <div className="bg-white rounded-xl shadow-sm p-8 flex flex-col items-center text-center"
            style={{ border: '1px solid rgba(13,148,136,0.2)' }}>
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center overflow-hidden mb-4 shadow-md">
              {liveAvatarUrl
                ? <img src={liveAvatarUrl} alt="avatar" className="w-full h-full object-cover" />
                : <span className="text-white font-bold" style={{ fontSize: 28 }}>{initials}</span>}
            </div>

            <h2 className="text-xl font-bold text-dark">
              {profile.first_name} {profile.last_name}
            </h2>
            <p className="text-sm text-slate-400 mt-0.5 mb-4">Member since {memberSince}</p>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="flex items-center gap-1.5 bg-teal-50 text-primary text-xs font-medium px-3 py-1.5 rounded-full">
                <Mail size={12} /> {profile.email}
              </span>
              {(profile.city || profile.country) && (
                <span className="flex items-center gap-1.5 bg-slate-100 text-slate-500 text-xs font-medium px-3 py-1.5 rounded-full">
                  <MapPin size={12} />
                  {[profile.city, profile.country].filter(Boolean).join(', ')}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Editable details */}
        {!isLoading && profile && (
          <ProfileForm
            formData={formData}
            onChange={handleChange}
            onSave={handleSave}
            onCancel={handleCancel}
            isSaving={isSaving}
            isEditing={isEditing}
            errors={errors}
            onAvatarChange={handleAvatarChange}
            profileEmail={profile.email}
            currentAvatarUrl={liveAvatarUrl}
          />
        )}

        {/* Trip galleries */}
        {!isLoading && (
          <>
            <TripGallery
              title="Preplanned Trips"
              trips={preplanned}
              emptyMessage="No upcoming trips planned yet."
            />
            <TripGallery
              title="Previous Trips"
              trips={previous}
              emptyMessage="No completed trips yet. Start exploring!"
            />
          </>
        )}

        {/* Danger zone */}
        {!isLoading && (
          <div className="rounded-xl p-5 space-y-3"
            style={{ border: '1px solid #FCA5A5', background: '#FFF5F5' }}>
            <h3 className="text-sm font-semibold text-red-500">Danger Zone</h3>
            <p className="text-xs text-red-400">
              Permanently delete your account and all trip data. This action cannot be undone.
            </p>

            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="border border-red-400 text-red-500 text-sm font-semibold px-4 py-2 rounded-xl
                  hover:bg-red-50 transition"
              >
                Delete My Account
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 transition-opacity duration-150">
                <p className="text-sm text-red-500 font-medium">Are you sure? This cannot be undone.</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 py-2
                      rounded-xl transition disabled:opacity-60 flex items-center gap-2"
                  >
                    {deleting ? (
                      <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                    ) : 'Yes, Delete'}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="border border-slate-200 text-slate-500 text-sm font-semibold px-4 py-2
                      rounded-xl hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
