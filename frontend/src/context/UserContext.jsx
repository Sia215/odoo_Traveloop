import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

const API = import.meta.env.VITE_API_URL
const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userLoading, setUserLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setUser(null); setUserLoading(false); return }
    const res = await fetch(`${API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    const data = await res.json()
    if (data.success) setUser(data.user)
    setUserLoading(false)
  }, [])

  useEffect(() => { refreshUser() }, [refreshUser])

  return (
    <UserContext.Provider value={{ user, setUser, refreshUser, userLoading }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
