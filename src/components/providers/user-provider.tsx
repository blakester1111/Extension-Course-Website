'use client'

import { createContext, useContext } from 'react'
import type { Profile } from '@/types/database'
import type { User } from '@supabase/supabase-js'

interface UserContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
}

const UserContext = createContext<UserContextType>({
  user: null,
  profile: null,
  loading: false,
})

export function UserProvider({
  initialUser,
  initialProfile,
  children,
}: {
  initialUser: User | null
  initialProfile: Profile | null
  children: React.ReactNode
}) {
  return (
    <UserContext.Provider value={{ user: initialUser, profile: initialProfile, loading: false }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUserContext() {
  return useContext(UserContext)
}
