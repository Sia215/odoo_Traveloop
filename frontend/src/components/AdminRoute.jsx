import React, { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { supabase } from '../lib/supabaseClient'
import { useToast } from '../hooks/useToast'

export default function AdminRoute({ children }) {
  const { user, loading: ctxLoading } = useUser()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [isAdmin, setIsAdmin] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function checkRole() {
      const loading = ctxLoading
      if (loading) return

      if (!user) {
        setIsAdmin(false)
        setChecking(false)
        return
      }

      // If role already on user object (from /api/auth/me), use it directly
      if (user.role) {
        setIsAdmin(user.role === 'admin')
        if (user.role !== 'admin') showToast("You don't have admin access.", 'error')
        setChecking(false)
        return
      }

      // Fallback: check profiles table
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        if (error) throw error
        if (data?.role === 'admin') {
          setIsAdmin(true)
        } else {
          setIsAdmin(false)
          showToast("You don't have admin access.", 'error')
        }
      } catch (err) {
        setIsAdmin(false)
        showToast("Error verifying access.", 'error')
      } finally {
        setChecking(false)
      }
    }
    checkRole()
  }, [user, ctxLoading, showToast])

  const loading = ctxLoading

  if (loading || checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D9488]"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (isAdmin === false) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
