import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, LogOut } from 'lucide-react'
import { useUser } from '../context/UserContext'
import { supabase } from '../lib/supabaseClient'

const TABS = [
  { id: 'overview',  label: 'Overview' },
  { id: 'users',     label: 'Manage Users' },
  { id: 'cities',    label: 'Popular Cities' },
  { id: 'analytics', label: 'Analytics' },
]

export default function AdminNavbar({ activeTab, onTabChange }) {
  const navigate = useNavigate()
  const { user } = useUser()
  const [confirmExit, setConfirmExit] = useState(false)

  const handleExit = () => {
    if (confirmExit) {
      navigate('/dashboard')
    } else {
      setConfirmExit(true)
      setTimeout(() => setConfirmExit(false), 3000)
    }
  }

  return (
    <nav className="sticky top-0 z-50 border-b-2 border-[#0D9488]" style={{ background: '#1E293B', height: '56px' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">

        {/* Left: brand */}
        <div className="flex items-center gap-2 shrink-0">
          <Shield size={18} className="text-[#0D9488]" />
          <span className="text-white font-bold text-sm">Traveloop Admin</span>
        </div>

        {/* Center: tabs */}
        <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-1.5 text-sm font-medium transition-all rounded-md
                ${activeTab === tab.id
                  ? 'text-white border-b-2 border-[#0D9488]'
                  : 'text-slate-400 hover:text-white'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right: admin name + exit */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-slate-400 text-xs">{user?.first_name} {user?.last_name}</span>
            <span className="text-[11px] font-semibold text-[#0D9488] border border-[#0D9488] px-2 py-0.5 rounded-full">
              Admin
            </span>
          </div>
          <button
            onClick={handleExit}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md border transition
              ${confirmExit
                ? 'bg-white text-[#1E293B] border-white'
                : 'text-white border-white/40 hover:bg-white hover:text-[#1E293B]'}`}
          >
            <LogOut size={13} />
            {confirmExit ? 'Confirm Exit?' : 'Exit Admin'}
          </button>
        </div>
      </div>

      {/* Mobile tabs */}
      <div className="md:hidden flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide" style={{ background: '#1E293B' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`shrink-0 px-3 py-1 text-xs font-medium rounded-full border transition
              ${activeTab === tab.id
                ? 'bg-[#0D9488] text-white border-[#0D9488]'
                : 'text-slate-400 border-slate-600 hover:text-white'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  )
}
