import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Phone, MapPin, Globe, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import AuthLayout from '../components/AuthLayout'
import InputField from '../components/InputField'
import AvatarUpload from '../components/AvatarUpload'
import { supabase } from '../lib/supabaseClient'

const API = import.meta.env.VITE_API_URL

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', password: '',
    phone: '', city: '', country: '', additional_info: '',
  })
  const [avatarFile, setAvatarFile] = useState(null)
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const validate = () => {
    const e = {}
    if (!form.first_name.trim()) e.first_name = 'Required'
    if (!form.last_name.trim()) e.last_name = 'Required'
    if (!form.email) e.email = 'Required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    if (!form.password) e.password = 'Required'
    else if (form.password.length < 6) e.password = 'Min 6 characters'
    if (!form.city.trim()) e.city = 'Required'
    if (!form.country.trim()) e.country = 'Required'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) return setErrors(errs)
    setErrors({})
    setLoading(true)

    // Upload avatar first (no userId yet, use temp name)
    let avatar_url = null
    if (avatarFile) {
      try {
        const ext = avatarFile.name.split('.').pop()
        const tempPath = `temp_${Date.now()}.${ext}`
        const { error } = await supabase.storage.from('avatars').upload(tempPath, avatarFile, { upsert: true })
        if (!error) {
          const { data } = supabase.storage.from('avatars').getPublicUrl(tempPath)
          avatar_url = data.publicUrl
        }
      } catch { /* avatar is optional */ }
    }

    // Call backend which handles both auth signup + profile insert
    const res = await fetch(`${API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, avatar_url }),
    })

    const result = await res.json()
    setLoading(false)

    if (!result.success) {
      const msg = result.message || 'Registration failed'
      toast.error(msg)
      if (msg.toLowerCase().includes('email')) setErrors({ email: msg })
      return
    }

    toast.success('Account created! Please log in.')
    navigate('/login')
  }

  return (
    <AuthLayout>
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-100 border border-slate-100 p-8">
        <AvatarUpload onFileSelect={setAvatarFile} />

        <h1 className="text-2xl font-bold text-dark text-center">Create Account</h1>
        <p className="text-slate-400 text-sm text-center mt-1 mb-7">Join Traveloop today</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {/* Row 1: Names */}
          <div className="grid grid-cols-2 gap-3">
            <InputField label="First Name" id="first_name" placeholder="Jane"
              value={form.first_name} onChange={set('first_name')} error={errors.first_name} />
            <InputField label="Last Name" id="last_name" placeholder="Doe"
              value={form.last_name} onChange={set('last_name')} error={errors.last_name} />
          </div>

          {/* Row 2: Email & Phone */}
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Email" id="email" type="email" placeholder="you@example.com"
              icon={Mail} value={form.email} onChange={set('email')} error={errors.email} />
            <InputField label="Phone" id="phone" type="tel" placeholder="+1 234 567 890"
              icon={Phone} value={form.phone} onChange={set('phone')} error={errors.phone} />
          </div>

          {/* Row 3: City & Country */}
          <div className="grid grid-cols-2 gap-3">
            <InputField label="City" id="city" placeholder="New York"
              icon={MapPin} value={form.city} onChange={set('city')} error={errors.city} />
            <InputField label="Country" id="country" placeholder="USA"
              icon={Globe} value={form.country} onChange={set('country')} error={errors.country} />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium text-dark">Password</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock size={17} />
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={set('password')}
                className={`w-full rounded-xl border px-4 py-2.5 pl-10 pr-10 text-sm text-dark placeholder-slate-400 outline-none transition
                  focus:ring-2 focus:ring-primary/30 focus:border-primary
                  ${errors.password ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
          </div>

          {/* Additional Info */}
          <div className="flex flex-col gap-1">
            <label htmlFor="additional_info" className="text-sm font-medium text-dark">
              Additional Information <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="additional_info"
              rows={3}
              placeholder="Tell us about your travel preferences..."
              value={form.additional_info}
              onChange={set('additional_info')}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-dark
                placeholder-slate-400 outline-none transition resize-none
                hover:border-slate-300 focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-teal-700 text-white font-semibold py-2.5 rounded-xl transition
              flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Creating account...
              </>
            ) : 'Register'}
          </button>

          <p className="text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">Login</Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  )
}
