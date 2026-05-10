import { Navigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'

export default function AdminRoute({ children }) {
  const { user, userLoading } = useUser()

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D9488]" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}
