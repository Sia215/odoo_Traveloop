import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

const API = import.meta.env.VITE_API_URL
export const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [userLoading, setUserLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { 
      setUser(null); 
      setProfile(null);
      setUserLoading(false); 
      return 
    }
    const res = await fetch(`${API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    const data = await res.json()
    if (data.success) {
      setUser(data.user)
      // Also fetch profile data for admin checks
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()
      setProfile(profileData)
    }
    setUserLoading(false)
  }, [])

  useEffect(() => { refreshUser() }, [refreshUser])

  return (
    <UserContext.Provider value={{ user, profile, setUser, setProfile, refreshUser, loading: userLoading, userLoading }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
