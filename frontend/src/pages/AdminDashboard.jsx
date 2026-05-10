import { useState, useEffect, useRef, useCallback } from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import AdminNavbar from '../components/AdminNavbar'
import StatCard from '../components/StatCard'
import EmptyState from '../components/EmptyState'
import { useToast } from '../hooks/useToast'
import { useUser } from '../context/UserContext'
import { supabase } from '../lib/supabaseClient'
import Toast from '../components/Toast'

const API = import.meta.env.VITE_API_URL
const PIE_COLORS = ['#0D9488', '#F97316', '#94A3B8']

const getToken = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session.access_token
}

function Skeleton({ className }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className}`} />
}

export default function AdminDashboard() {
  const { user } = useUser()
  const { toasts, showToast, removeToast } = useToast()

  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [cities, setCities] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [userSearch, setUserSearch] = useState('')
  const [userPage, setUserPage] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(null)

  const usersLoadedRef = useRef(false)
  const analyticsLoadedRef = useRef(false)
  const searchTimerRef = useRef(null)
  const pollRef = useRef(null)

  // ── fetch helpers ──────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    const token = await getToken()
    const res = await fetch(`${API}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    setStats(data)
  }, [])

  const fetchCities = useCallback(async () => {
    const token = await getToken()
    const res = await fetch(`${API}/api/admin/cities/popular`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    setCities((data.cities || []).map(c => ({ ...c, popularity: c.count })))
  }, [])

  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchUsers = useCallback(async (search = '', page = 1) => {
    const token = await getToken()
    const res = await fetch(
      `${API}/api/admin/users?search=${encodeURIComponent(search)}&page=${page}&limit=10`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const data = await res.json()
    setUsers(data.users || [])
    setTotalUsers(data.total || 0)
    setLastUpdated(new Date())
  }, [])

  const fetchAnalytics = useCallback(async () => {
    const token = await getToken()
    const res = await fetch(`${API}/api/admin/analytics`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    setAnalytics(data)
  }, [])

  // ── on mount: fetch stats + cities + start live poll ──────
  useEffect(() => {
    Promise.all([fetchStats(), fetchCities()]).finally(() => setIsLoading(false))

    // Poll stats every 30s for live counts
    pollRef.current = setInterval(() => {
      fetchStats()
      fetchCities()
    }, 30000)
    return () => clearInterval(pollRef.current)
  }, [fetchStats, fetchCities])

  // ── tab change: always re-fetch users/analytics fresh ─────
  useEffect(() => {
    if (activeTab === 'users') {
      usersLoadedRef.current = true
      fetchUsers(userSearch, userPage)
    }
    if (activeTab === 'analytics') {
      analyticsLoadedRef.current = true
      fetchAnalytics()
    }
  }, [activeTab]) // eslint-disable-line

  // ── user search debounce ───────────────────────────────────
  useEffect(() => {
    clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      setUserPage(1)
      fetchUsers(userSearch, 1)
    }, 400)
    return () => clearTimeout(searchTimerRef.current)
  }, [userSearch, fetchUsers])

  // ── pagination ─────────────────────────────────────────────
  useEffect(() => {
    if (usersLoadedRef.current) fetchUsers(userSearch, userPage)
  }, [userPage]) // eslint-disable-line

  // ── refresh all ───────────────────────────────────────────
  const handleRefresh = async () => {
    setIsLoading(true)
    const all = [fetchStats(), fetchCities()]
    if (activeTab === 'users') all.push(fetchUsers(userSearch, userPage))
    if (activeTab === 'analytics') all.push(fetchAnalytics())
    await Promise.all(all)
    setIsLoading(false)
    showToast('Data refreshed', 'success')
  }

  // ── remove user ────────────────────────────────────────────
  const handleRemoveUser = async (u) => {
    setIsSaving(true)
    try {
      const token = await getToken()
      const res = await fetch(`${API}/api/admin/users/${u.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setUsers(prev => prev.filter(x => x.id !== u.id))
      setTotalUsers(prev => prev - 1)
      showToast(`${u.first_name} removed`, 'success')
    } catch (err) {
      showToast(err.message || 'Failed to remove user', 'error')
    } finally {
      setIsSaving(false)
      setConfirmRemove(null)
    }
  }

  const totalPages = Math.ceil(totalUsers / 10)

  // ── loading skeleton ───────────────────────────────────────
  if (isLoading) return (
    <div className="min-h-screen" style={{ background: '#F1F5F9' }}>
      <AdminNavbar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    </div>
  )

  // ── chart guard ────────────────────────────────────────────
  const ChartCard = ({ title, children, data, className = '' }) => (
    <div className={`bg-white rounded-xl p-5 shadow-sm ${className}`}>
      {title && <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>}
      {!data || data.length === 0
        ? <EmptyState message="No data available yet" />
        : children}
    </div>
  )

  // ══════════════════════════════════════════════════════════
  // TAB: OVERVIEW
  // ══════════════════════════════════════════════════════════
  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Row 1 — stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Users"      value={stats?.totalUsers      || 0} icon="👥" color="teal"   />
        <StatCard label="Total Trips"      value={stats?.totalTrips      || 0} icon="✈️" color="orange" />
        <StatCard label="Total Cities"     value={stats?.totalCities     || 0} icon="🏙" color="blue"   />
        <StatCard label="Total Activities" value={stats?.totalActivities || 0} icon="⭐" color="purple" />
      </div>

      {/* Row 2 — status cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Ongoing',   value: stats?.ongoingTrips,   dot: 'bg-green-400' },
          { label: 'Upcoming',  value: stats?.upcomingTrips,  dot: 'bg-teal-400'  },
          { label: 'Completed', value: stats?.completedTrips, dot: 'bg-slate-400' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${s.dot}`} />
            <div>
              <div className="text-xl font-bold text-[#1E293B]">{s.value ?? 0}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Row 3 — charts */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Bar chart — top cities */}
        <ChartCard title="Top Cities" data={cities} className="md:col-span-3">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={cities} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="popularity" fill="#0D9488" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Pie chart — trip status */}
        <ChartCard
          title="Trip Status"
          data={analytics?.tripStatus || stats ? [
            { status: 'Ongoing',   count: stats?.ongoingTrips   || 0 },
            { status: 'Upcoming',  count: stats?.upcomingTrips  || 0 },
            { status: 'Completed', count: stats?.completedTrips || 0 },
          ] : []}
          className="md:col-span-2"
        >
          {(() => {
            const pieData = [
              { status: 'Ongoing',   count: stats?.ongoingTrips   || 0 },
              { status: 'Upcoming',  count: stats?.upcomingTrips  || 0 },
              { status: 'Completed', count: stats?.completedTrips || 0 },
            ]
            return (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={70}>
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2 flex-wrap">
                  {pieData.map((d, i) => (
                    <div key={d.status} className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                      {d.status}
                    </div>
                  ))}
                </div>
              </>
            )
          })()}
        </ChartCard>
      </div>

      {/* Row 4 — recent users */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700">Recent Users</h3>
          <button
            onClick={() => setActiveTab('users')}
            className="text-xs font-semibold text-[#0D9488] hover:underline"
          >
            View All →
          </button>
        </div>
        <RecentUsersTable />
      </div>
    </div>
  )

  // ── recent users (last 5, no pagination) ──────────────────
  const RecentUsersTable = () => {
    const [recentUsers, setRecentUsers] = useState([])
    useEffect(() => {
      getToken().then(token =>
        fetch(`${API}/api/admin/users?page=1&limit=5`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.json()).then(d => setRecentUsers(d.users || []))
      )
    }, [])
    if (!recentUsers.length) return <EmptyState message="No users yet" />
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-400 border-b border-slate-100">
              {['Name', 'Email', 'City', 'Joined'].map(h => (
                <th key={h} className="text-left pb-2 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentUsers.map(u => (
              <tr key={u.id} className="border-b border-slate-50 last:border-0">
                <td className="py-2.5 font-medium text-[#1E293B]">{u.first_name} {u.last_name}</td>
                <td className="py-2.5 text-slate-500">{u.email}</td>
                <td className="py-2.5 text-slate-500">{u.city || '—'}</td>
                <td className="py-2.5 text-slate-400">{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════
  // TAB: MANAGE USERS
  // ══════════════════════════════════════════════════════════
  const UsersTab = () => (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search by name or email…"
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
            className="w-64 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none
              focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
          />
          <span className="text-xs text-slate-400">
            {totalUsers} user{totalUsers !== 1 ? 's' : ''} total
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-green-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Live
          </span>
          {lastUpdated && (
            <span className="text-xs text-slate-400">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => fetchUsers(userSearch, userPage)}
            className="text-xs font-semibold text-[#0D9488] border border-[#0D9488] px-3 py-1.5 rounded-lg hover:bg-[#0D9488] hover:text-white transition"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-xs text-slate-400">
                {['#', 'Name', 'Email', 'City', 'Joined', 'Action'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={6}><EmptyState message="No users found" /></td></tr>
              ) : users.map((u, i) => {
                const initials = `${u.first_name?.[0] || ''}${u.last_name?.[0] || ''}`.toUpperCase()
                const isConfirming = confirmRemove === u.id
                return (
                  <tr key={u.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-slate-400">{(userPage - 1) * 10 + i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ background: '#0D9488' }}
                        >
                          {initials || '?'}
                        </div>
                        <span className="font-medium text-[#1E293B]">{u.first_name} {u.last_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{u.email}</td>
                    <td className="px-4 py-3 text-slate-500">{u.city || '—'}</td>
                    <td className="px-4 py-3 text-slate-400">{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3">
                      {u.role === 'admin' ? (
                        <span className="text-xs text-slate-400 italic">Admin</span>
                      ) : isConfirming ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">Remove {u.first_name}?</span>
                          <button
                            onClick={() => handleRemoveUser(u)}
                            disabled={isSaving}
                            className="text-xs font-semibold text-white bg-red-500 px-2 py-1 rounded-lg hover:bg-red-600 disabled:opacity-50"
                          >Yes</button>
                          <button
                            onClick={() => setConfirmRemove(null)}
                            className="text-xs font-semibold text-slate-500 border border-slate-200 px-2 py-1 rounded-lg hover:bg-slate-50"
                          >No</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmRemove(u.id)}
                          className="text-xs font-semibold text-red-500 border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50 transition"
                        >Remove</button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setUserPage(p => Math.max(1, p - 1))}
            disabled={userPage === 1}
            className="text-sm font-medium text-slate-500 border border-slate-200 px-3 py-1.5 rounded-lg
              hover:bg-slate-50 disabled:opacity-40 transition"
          >Prev</button>
          <span className="text-sm text-slate-500">Page {userPage} of {totalPages}</span>
          <button
            onClick={() => setUserPage(p => Math.min(totalPages, p + 1))}
            disabled={userPage === totalPages}
            className="text-sm font-medium text-slate-500 border border-slate-200 px-3 py-1.5 rounded-lg
              hover:bg-slate-50 disabled:opacity-40 transition"
          >Next</button>
        </div>
      )}
    </div>
  )

  // ══════════════════════════════════════════════════════════
  // TAB: POPULAR CITIES
  // ══════════════════════════════════════════════════════════
  const CitiesTab = () => (
    <div className="space-y-6">
      <ChartCard title="Top Destinations" data={cities}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={cities} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="popularity" fill="#0D9488" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-xs text-slate-400">
              {['City', 'Country', 'Popularity Score'].map(h => (
                <th key={h} className="text-left px-5 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...cities].sort((a, b) => b.popularity - a.popularity).map(c => (
              <tr key={c.name} className="border-t border-slate-50 hover:bg-slate-50/50">
                <td className="px-5 py-3 font-medium text-[#1E293B]">{c.name}</td>
                <td className="px-5 py-3 text-slate-500">{c.country}</td>
                <td className="px-5 py-3 text-[#0D9488] font-semibold">{c.popularity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  // ══════════════════════════════════════════════════════════
  // TAB: ANALYTICS
  // ══════════════════════════════════════════════════════════
  const AnalyticsTab = () => (
    <div className="space-y-6">
      {/* Line chart — user growth */}
      <ChartCard title="User Registrations — Last 6 Months" data={analytics?.userGrowth}>
        <ResponsiveContainer width="100%" height={270}>
          <LineChart data={analytics?.userGrowth || []} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line
              type="monotone" dataKey="count" stroke="#0D9488" strokeWidth={2.5}
              dot={{ fill: '#0D9488', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Horizontal bar — activity categories */}
        <ChartCard title="Activities by Category" data={analytics?.activityCategories}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              layout="vertical"
              data={analytics?.activityCategories || []}
              margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={80} />
              <Tooltip />
              <Bar dataKey="count" fill="#F97316" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Platform summary */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Platform Summary</h3>
          {[
            { label: 'Total Users',      value: stats?.totalUsers      },
            { label: 'Total Trips',      value: stats?.totalTrips      },
            { label: 'Ongoing Trips',    value: stats?.ongoingTrips    },
            { label: 'Cities',           value: stats?.totalCities     },
            { label: 'Activities',       value: stats?.totalActivities },
          ].map((row, i, arr) => (
            <div
              key={row.label}
              className={`flex items-center justify-between py-3 ${i < arr.length - 1 ? 'border-b' : ''}`}
              style={{ borderColor: '#F1F5F9' }}
            >
              <span className="text-sm text-slate-400">{row.label}</span>
              <span className="text-sm font-bold" style={{ color: '#0D9488' }}>{row.value ?? 0}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen" style={{ background: '#F1F5F9' }}>
      <AdminNavbar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-[#1E293B]">Admin Dashboard</h1>
            <p className="text-sm text-slate-400 mt-0.5">Manage your Traveloop platform</p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 text-sm font-semibold text-[#0D9488] border border-[#0D9488]
              px-4 py-2 rounded-xl hover:bg-[#0D9488] hover:text-white transition"
          >
            ↻ Refresh
          </button>
        </div>

        {activeTab === 'overview'  && <OverviewTab />}
        {activeTab === 'users'     && <UsersTab />}
        {activeTab === 'cities'    && <CitiesTab />}
        {activeTab === 'analytics' && <AnalyticsTab />}
      </div>

      {/* Toasts */}
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  )
}
