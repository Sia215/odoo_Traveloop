import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  MapPin,
  Activity,
  TrendingUp,
  Search,
  Filter,
  SortAsc,
  LogOut,
  User,
  MoreVertical,
  Eye,
  UserX,
  Trash2
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts'
import { supabase } from '../lib/supabaseClient'
import { UserContext } from '../context/UserContext'
import toast from 'react-hot-toast'

const TABS = [
  { id: 'users', label: 'Manage Users', icon: Users },
  { id: 'cities', label: 'Popular Cities', icon: MapPin },
  { id: 'activities', label: 'Popular Activities', icon: Activity },
  { id: 'analytics', label: 'User Trends and Analytics', icon: TrendingUp }
]

const TAB_DESCRIPTIONS = {
  users: {
    title: 'Manage User Section:',
    description: 'View and manage all registered users. Monitor user activity, update roles, and handle account suspensions. Access detailed user statistics and trip information.'
  },
  cities: {
    title: 'Popular Cities:',
    description: 'Track the most popular destinations in Traveloop. View trip counts, average budgets, and duration statistics for each city. Monitor trending destinations.'
  },
  activities: {
    title: 'Popular Activities:',
    description: 'Analyze the most booked activities across all trips. See usage statistics by category, average costs, and top cities for each activity type.'
  },
  analytics: {
    title: 'User Trends and Analytics:',
    description: 'Comprehensive analytics dashboard showing user growth, daily active users, trip creation patterns, and key performance metrics for the platform.'
  }
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users')
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [cities, setCities] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const { user, profile, setUser, setProfile } = useContext(UserContext)
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      switch (activeTab) {
        case 'users':
          await loadUsers()
          break
        case 'cities':
          await loadCities()
          break
        case 'activities':
          await loadActivities()
          break
        case 'analytics':
          await loadAnalytics()
          break
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(50)

    if (error) throw error
    setUsers(data || [])
  }

  const loadCities = async () => {
    // Mock data - replace with actual API call
    setCities([
      { rank: 1, name: 'Paris', country: 'France', timesAdded: 450, avgDuration: 7, avgBudget: 2500, trend: 'up' },
      { rank: 2, name: 'Tokyo', country: 'Japan', timesAdded: 380, avgDuration: 10, avgBudget: 3200, trend: 'up' },
      { rank: 3, name: 'New York', country: 'USA', timesAdded: 320, avgDuration: 8, avgBudget: 2800, trend: 'down' }
    ])
  }

  const loadActivities = async () => {
    // Mock data - replace with actual API call
    setActivities([
      { rank: 1, name: 'Eiffel Tower Visit', category: 'Sightseeing', timesUsed: 520, avgCost: 85, topCity: 'Paris', trend: 'up' },
      { rank: 2, name: 'Central Park Walk', category: 'Sightseeing', timesUsed: 480, avgCost: 0, topCity: 'New York', trend: 'stable' },
      { rank: 3, name: 'Sushi Dinner', category: 'Food', timesUsed: 450, avgCost: 120, topCity: 'Tokyo', trend: 'up' }
    ])
  }

  const loadAnalytics = async () => {
    // Mock data - replace with actual API call
    setAnalytics({
      totals: { users: 1250, trips: 3400, activities: 8900 },
      monthlyGrowth: [
        { month: 'Jan', users: 120 },
        { month: 'Feb', users: 180 },
        { month: 'Mar', users: 220 },
        { month: 'Apr', users: 280 },
        { month: 'May', users: 350 },
        { month: 'Jun', users: 420 }
      ],
      dauLast30Days: Array.from({ length: 30 }, (_, i) => ({
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        users: Math.floor(Math.random() * 200) + 50
      })),
      tripsPerMonth: [
        { month: 'Jan', trips: 450 },
        { month: 'Feb', trips: 520 },
        { month: 'Mar', trips: 680 },
        { month: 'Apr', trips: 750 },
        { month: 'May', trips: 820 },
        { month: 'Jun', trips: 900 }
      ],
      peakStats: {
        avgTripsPerUser: 2.7,
        avgActivitiesPerTrip: 8.5,
        mostActiveDay: 'Saturday',
        peakUsageHour: '14:00'
      }
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    navigate('/admin/login')
  }

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )
    }

    switch (activeTab) {
      case 'users':
        return <UsersTab users={users} onRefresh={loadUsers} />
      case 'cities':
        return <CitiesTab cities={cities} />
      case 'activities':
        return <ActivitiesTab activities={activities} />
      case 'analytics':
        return <AnalyticsTab analytics={analytics} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900">Traveloop</h1>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Controls */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                <Filter className="w-4 h-4" />
                Filter
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                <SortAsc className="w-4 h-4" />
                Sort
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {renderTabContent()}
          </div>

          {/* Info Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                {TAB_DESCRIPTIONS[activeTab].title}
              </h3>
              <p className="text-sm text-gray-600">
                {TAB_DESCRIPTIONS[activeTab].description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Tab Components
function UsersTab({ users, onRefresh }) {
  const tripCategories = [
    { name: 'Adventure', value: 60, color: '#3b82f6' },
    { name: 'Budget', value: 20, color: '#6b7280' },
    { name: 'Luxury', value: 10, color: '#22c55e' },
    { name: 'Cultural', value: 10, color: '#f59e0b' }
  ]

  const userGrowth = [
    { month: 'Jan', users: 120 },
    { month: 'Feb', users: 180 },
    { month: 'Mar', users: 220 },
    { month: 'Apr', users: 280 },
    { month: 'May', users: 350 },
    { month: 'Jun', users: 420 }
  ]

  const topActivities = [
    { name: 'Sightseeing', count: 450 },
    { name: 'Food Tours', count: 380 },
    { name: 'Adventure', count: 320 },
    { name: 'Shopping', count: 290 },
    { name: 'Transport', count: 270 }
  ]

  return (
    <div className="space-y-6">
      {/* Top Section - User List and Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Users</h3>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {users.map((user) => (
              <div key={user.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.full_name || 'No name'}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    user.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role}
                  </span>
                  <span className="text-sm text-gray-500">0 trips</span>
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Trip Categories</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={tripCategories}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {tripCategories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-1">
            {tripCategories.map((category) => (
              <div key={category.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <span>{category.name}</span>
                </div>
                <span className="font-medium">{category.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Middle Section - User Growth Line Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">User Growth Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={userGrowth}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="users"
              stroke="#f43f5e"
              strokeWidth={2}
              dot={{ fill: '#f43f5e', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Section - Bar Chart and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Activities</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topActivities}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#f97316" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Stats Table */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Platform Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Total Users</span>
              <span className="text-sm font-medium">1,250</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Active Trips</span>
              <span className="text-sm font-medium">340</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Avg Trip Duration</span>
              <span className="text-sm font-medium">7.2 days</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Most Popular City</span>
              <span className="text-sm font-medium">Paris</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-gray-600">Conversion Rate</span>
              <span className="text-sm font-medium">68%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CitiesTab({ cities }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Popular Cities</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Times Added</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Duration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Budget</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cities.map((city) => (
              <tr key={city.rank}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{city.rank}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{city.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{city.country}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{city.timesAdded}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{city.avgDuration} days</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${city.avgBudget}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    city.trend === 'up' ? 'bg-green-100 text-green-800' :
                    city.trend === 'down' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {city.trend === 'up' ? '↑' : city.trend === 'down' ? '↓' : '→'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ActivitiesTab({ activities }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Popular Activities</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Times Used</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Cost</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Top City</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {activities.map((activity) => (
              <tr key={activity.rank}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{activity.rank}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{activity.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{activity.timesUsed}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${activity.avgCost}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{activity.topCity}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    activity.trend === 'up' ? 'bg-green-100 text-green-800' :
                    activity.trend === 'down' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {activity.trend === 'up' ? '↑' : activity.trend === 'down' ? '↓' : '→'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AnalyticsTab({ analytics }) {
  if (!analytics) return null

  return (
    <div className="space-y-6">
      {/* DAU Line Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Active Users (Last 30 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analytics.dauLast30Days}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="users"
              stroke="#f43f5e"
              strokeWidth={2}
              dot={{ fill: '#f43f5e', strokeWidth: 2, r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* New Signups Line Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">New User Signups (Last 12 Weeks)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analytics.monthlyGrowth}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="users"
              stroke="#f43f5e"
              strokeWidth={2}
              dot={{ fill: '#f43f5e', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Trips per Month Bar Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Trips Created per Month</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analytics.tripsPerMonth}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="trips" fill="#f97316" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Trip Categories Pie Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Trip Category Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={[
                { name: 'Adventure', value: 60, color: '#3b82f6' },
                { name: 'Budget', value: 20, color: '#6b7280' },
                { name: 'Luxury', value: 10, color: '#22c55e' },
                { name: 'Cultural', value: 10, color: '#f59e0b' }
              ]}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {[
                { name: 'Adventure', value: 60, color: '#3b82f6' },
                { name: 'Budget', value: 20, color: '#6b7280' },
                { name: 'Luxury', value: 10, color: '#22c55e' },
                { name: 'Cultural', value: 10, color: '#f59e0b' }
              ].map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h4 className="text-sm font-medium text-gray-500">Avg Trips per User</h4>
          <p className="text-2xl font-bold text-gray-900">{analytics.peakStats.avgTripsPerUser}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h4 className="text-sm font-medium text-gray-500">Avg Activities per Trip</h4>
          <p className="text-2xl font-bold text-gray-900">{analytics.peakStats.avgActivitiesPerTrip}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h4 className="text-sm font-medium text-gray-500">Most Active Day</h4>
          <p className="text-2xl font-bold text-gray-900">{analytics.peakStats.mostActiveDay}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h4 className="text-sm font-medium text-gray-500">Peak Usage Hour</h4>
          <p className="text-2xl font-bold text-gray-900">{analytics.peakStats.peakUsageHour}</p>
        </div>
      </div>
    </div>
  )
}