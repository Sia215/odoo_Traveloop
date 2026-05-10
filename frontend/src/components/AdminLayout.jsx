import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'

export default function AdminLayout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useUser()

  const navItems = [
    { label: 'Overview', path: '/admin' },
    { label: 'Users', path: '/admin/users' },
    { label: 'Trips', path: '/admin/trips' },
    { label: 'Cities', path: '/admin/cities' }
  ]

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      {/* Admin Topbar */}
      <header className="flex items-center justify-between h-[56px] px-6 bg-white border-b border-[#E2E8F0] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#0D9488] rounded-lg flex items-center justify-center text-white font-bold">
            T
          </div>
          <span className="text-xl font-bold text-[#0D9488]">Traveloop Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#1E293B] font-medium hidden sm:block">
            {user?.user_metadata?.first_name || 'Admin'} {user?.user_metadata?.last_name || ''}
          </span>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-1.5 text-sm font-medium text-[#0D9488] border border-[#0D9488] rounded-lg hover:bg-[#F0FDFA] transition-colors"
          >
            ← Back to App
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[220px] bg-white border-r border-[#E2E8F0] hidden md:flex flex-col shrink-0 overflow-y-auto">
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-[#0D9488] text-white' 
                      : 'text-[#1E293B] hover:bg-[#F1F5F9]'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <div className="p-4 border-t border-[#E2E8F0]">
            <span className="text-xs text-gray-500 uppercase font-semibold">Settings</span>
            {/* Placeholder for future settings link */}
            <div className="mt-2 text-sm text-gray-400 cursor-not-allowed px-4 py-2">
              System Settings
            </div>
          </div>
        </aside>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
