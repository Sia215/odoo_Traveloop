import { useNavigate } from 'react-router-dom'

export default function AdminCities() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold text-gray-800">Admin — Cities</h1>
      <p className="text-gray-500 text-sm">City management is available in the main Admin Dashboard.</p>
      <button
        onClick={() => navigate('/admin')}
        className="px-5 py-2.5 bg-[#0D9488] text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition"
      >
        ← Back to Admin Dashboard
      </button>
    </div>
  )
}
