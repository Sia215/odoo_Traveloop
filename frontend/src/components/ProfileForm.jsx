import { useRef, useState } from 'react'
import { Lock, Camera } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabaseClient'
import InputField from './InputField'

const API = import.meta.env.VITE_API_URL

const ROW = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:items-center py-3 border-b border-slate-100 last:border-0">
    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 sm:w-36 shrink-0 mb-0.5 sm:mb-0">
      {label}
    </span>
    <span className="text-sm font-medium text-dark">
      {value || <span className="text-slate-300 italic">—</span>}
    </span>
  </div>
)

export default function ProfileForm({
  formData, onChange, onSave, onCancel, isSaving,
  isEditing, errors, onAvatarChange, profileEmail, currentAvatarUrl,
}) {
  const fileRef = useRef()
  const [uploading, setUploading] = useState(false)

  const set = (field) => (e) => onChange(field, e.target.value)

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB')
      return
    }

    setUploading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { toast.error('Not logged in'); return }

      const ext = file.name.split('.').pop().toLowerCase()
      const path = `${session.user.id}_${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })

      if (uploadError) {
        console.error('Avatar upload error:', uploadError)
        toast.error('Upload failed: ' + uploadError.message)
        return
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      onAvatarChange(data.publicUrl)
      toast.success('Photo updated!')
    } catch (err) {
      console.error('Avatar upload exception:', err)
      toast.error('Upload failed. Try again.')
    } finally {
      setUploading(false)
      // Reset input so same file can be re-selected
      e.target.value = ''
    }
  }

  const initials = `${formData.first_name?.[0] ?? ''}${formData.last_name?.[0] ?? ''}`.toUpperCase()

  if (!isEditing) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-sm font-bold text-dark mb-4">Personal Information</h3>
        <ROW label="First Name" value={formData.first_name} />
        <ROW label="Last Name" value={formData.last_name} />
        <div className="flex flex-col sm:flex-row sm:items-center py-3 border-b border-slate-100">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 sm:w-36 shrink-0 mb-0.5 sm:mb-0">
            Email
          </span>
          <span className="text-sm font-medium text-dark">{profileEmail}</span>
          <span className="text-xs text-slate-300 italic ml-2 hidden sm:inline">(cannot be changed)</span>
        </div>
        <ROW label="Phone" value={formData.phone} />
        <ROW label="City" value={formData.city} />
        <ROW label="Country" value={formData.country} />
        <ROW label="About" value={formData.additional_info} />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-5">
      <h3 className="text-sm font-bold text-dark">Edit Personal Information</h3>

      {/* Avatar upload */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center overflow-hidden shrink-0 relative group cursor-pointer"
          onClick={() => fileRef.current.click()}>
          {currentAvatarUrl
            ? <img src={currentAvatarUrl} alt="avatar" className="w-full h-full object-cover" />
            : <span className="text-white text-xl font-bold">{initials || '?'}</span>}
          <div className="absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
            <Camera size={18} className="text-white" />
          </div>
        </div>
        <div>
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current.click()}
            className="text-sm text-primary font-medium hover:underline disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Change Photo'}
          </button>
          <p className="text-xs text-slate-400 mt-0.5">JPG or PNG, max 5MB</p>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        </div>
      </div>

      {/* Email (disabled) */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-dark flex items-center gap-1.5">
          Email <Lock size={12} className="text-slate-400" />
        </label>
        <input
          type="email"
          value={profileEmail}
          disabled
          className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm text-slate-400 cursor-not-allowed"
        />
        <p className="text-xs text-slate-400 italic">Email cannot be changed after registration</p>
      </div>

      {/* Row 1: Names */}
      <div className="grid grid-cols-2 gap-4">
        <InputField label="First Name" id="first_name" placeholder="Jane"
          value={formData.first_name} onChange={set('first_name')}
          error={errors?.first_name} disabled={isSaving} />
        <InputField label="Last Name" id="last_name" placeholder="Doe"
          value={formData.last_name} onChange={set('last_name')}
          error={errors?.last_name} disabled={isSaving} />
      </div>

      {/* Row 2: Phone & City */}
      <div className="grid grid-cols-2 gap-4">
        <InputField label="Phone" id="phone" type="tel" placeholder="+91 9876543210"
          value={formData.phone} onChange={set('phone')}
          error={errors?.phone} disabled={isSaving} />
        <InputField label="City" id="city" placeholder="Surat"
          value={formData.city} onChange={set('city')}
          error={errors?.city} disabled={isSaving} />
      </div>

      {/* Row 3: Country */}
      <InputField label="Country" id="country" placeholder="India"
        value={formData.country} onChange={set('country')}
        error={errors?.country} disabled={isSaving} />

      {/* Row 4: About */}
      <div className="flex flex-col gap-1">
        <label htmlFor="additional_info" className="text-sm font-medium text-dark">
          About <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="additional_info"
          rows={3}
          placeholder="Tell us about yourself..."
          value={formData.additional_info}
          onChange={set('additional_info')}
          disabled={isSaving}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-dark
            placeholder-slate-400 outline-none resize-none transition
            hover:border-slate-300 focus:ring-2 focus:ring-primary/30 focus:border-primary
            disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="flex-1 border border-slate-200 text-slate-500 font-semibold py-2.5 rounded-xl
            hover:bg-slate-50 transition disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="flex-1 bg-primary hover:bg-teal-700 text-white font-semibold py-2.5 rounded-xl
            transition flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isSaving ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
