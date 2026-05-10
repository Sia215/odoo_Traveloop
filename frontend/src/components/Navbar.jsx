import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Bell, ChevronDown, Menu, X, MapPin, LogOut, User, Settings } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useUser } from '../context/UserContext'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user: profile, refreshUser } = useUser()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const dropdownRef = useRef()

  const navLinks = [
    { label: 'Home', path: '/dashboard' },
    { label: 'My Trips', path: '/trips' },
    { label: 'Explore', path: '/explore' },
    { label: 'Community', path: '/community' },
  ]

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const initials = profile
    ? `${profile.first_name?.[0] ?? ''}${profile.last_name?.[0] ?? ''}`.toUpperCase()
    : '?'

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <MapPin size={16} className="text-white" />
            </div>
            <span className="text-xl font-bold text-primary">Traveloop</span>
          </Link>

          {/* Center nav links — desktop */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition
                  ${location.pathname === link.path
                    ? 'bg-teal-50 text-primary'
                    : 'text-slate-500 hover:text-dark hover:bg-slate-50'}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Bell */}
            <button className="relative p-2 rounded-lg text-slate-400 hover:text-dark hover:bg-slate-50 transition">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
            </button>

            {/* Avatar + dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-50 transition"
              >
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center overflow-hidden">
                  {profile?.avatar_url
                    ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                    : <span className="text-white text-xs font-bold">{initials}</span>}
                </div>
                <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 fade-in">
                  <div className="px-4 py-2 border-b border-slate-50">
                    <p className="text-sm font-semibold text-dark">
                      {profile ? `${profile.first_name} ${profile.last_name}` : 'User'}
                    </p>
                  </div>
                  <Link to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition">
                    <User size={15} /> Profile
                  </Link>
                  <Link to="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition">
                    <Settings size={15} /> Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition">
                    <LogOut size={15} /> Logout
                  </button>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-dark hover:bg-slate-50 transition"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 flex flex-col gap-1 fade-in">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileOpen(false)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition
                ${location.pathname === link.path
                  ? 'bg-teal-50 text-primary'
                  : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
