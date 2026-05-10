import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

const API = import.meta.env.VITE_API_URL
export const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [userLoading, setUserLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    setUserLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setUser(null)
        setProfile(null)
        return
      }

      // Single fetch — /api/auth/me returns full profile including role
      const res = await fetch(`${API}/api/auth/me`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      if (data.success && data.user) {
        // Ensure role defaults to 'user' if null/missing
        const userWithRole = { ...data.user, role: data.user.role || 'user' }
        setUser(userWithRole)
        setProfile(userWithRole)
      } else {
        setUser(null)
        setProfile(null)
      }
    } catch {
      setUser(null)
      setProfile(null)
    } finally {
      setUserLoading(false)
    }
  }, [])

  useEffect(() => { refreshUser() }, [refreshUser])

  return (
    <UserContext.Provider value={{ user, profile, setUser, setProfile, refreshUser, loading: userLoading, userLoading }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
