import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, UserCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import AuthLayout from '../components/AuthLayout'
import InputField from '../components/InputField'
import { supabase } from '../lib/supabaseClient'
import { useUser } from '../context/UserContext'

const API = import.meta.env.VITE_API_URL

export default function Login() {
  const navigate = useNavigate()
  const { refreshUser } = useUser()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 6) e.password = 'Minimum 6 characters'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) return setErrors(errs)
    setErrors({})
    setLoading(true)

    try {
      // Call backend so we get the profile role back
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      })
      const data = await res.json()
      setLoading(false)

      if (!res.ok || !data.success) {
        const msg = data.message || data.error || 'Invalid email or password'
        toast.error(msg)
        setErrors({ form: msg })
        return
      }

      // Restore Supabase client session so all subsequent API calls work
      if (data.session) {
        await supabase.auth.setSession({
          access_token:  data.session.access_token,
          refresh_token: data.session.refresh_token,
        })
        // Refresh UserContext so ProtectedRoute sees the logged-in user
        await refreshUser()
      }

      localStorage.setItem('traveloop_session', JSON.stringify(data.session))
      toast.success('Welcome back!')

      // Redirect based on role
      if (data.user?.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setLoading(false)
      toast.error('Something went wrong. Please try again.')
    }
  }

  return (
    <AuthLayout>
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-100 border border-slate-100 p-8">
        {/* Avatar */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-teal-50 border-2 border-primary/20 flex items-center justify-center">
            <UserCircle2 size={40} className="text-primary/60" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-dark text-center">Welcome Back</h1>
        <p className="text-slate-400 text-sm text-center mt-1 mb-7">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <InputField
            label="Email Address"
            id="email"
            type="email"
            placeholder="you@example.com"
            icon={Mail}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            error={errors.email}
          />

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium text-dark">Password</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock size={17} />
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={`w-full rounded-xl border px-4 py-2.5 pl-10 pr-10 text-sm text-dark placeholder-slate-400 outline-none transition
                  focus:ring-2 focus:ring-primary/30 focus:border-primary
                  ${errors.password ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
          </div>

          <div className="flex justify-end -mt-1">
            <button type="button" className="text-xs text-primary hover:underline font-medium">
              Forgot Password?
            </button>
          </div>

          {errors.form && (
            <p className="text-sm text-red-500 text-center bg-red-50 rounded-lg py-2">{errors.form}</p>
          )}

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
                Signing in...
              </>
            ) : 'Login'}
          </button>

          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs text-slate-400">or</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          <p className="text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-semibold hover:underline">
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  )
}
