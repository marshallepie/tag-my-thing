// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase env missing:', {
    VITE_SUPABASE_URL: !!supabaseUrl,
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? `present (len ${supabaseAnonKey.length})` : 'missing',
  })
  // Optional: export a dummy client or a function that throws when used.
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  global: {
    headers: {
       // ✅ Ensure these go out on every request
       apikey: supabaseAnonKey,
      'X-Client-Info': 'tagmything-web' },
  },
  db: { schema: 'public' },
})

// --- Helpers ---

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('Error getting current user:', error)
    return null
  }
  return user
}

export const isAdmin = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', userId)
    .single()
  if (error) {
    console.error('Error checking admin status:', error)
    return false
  }
  return data?.role === 'admin'
}

export const isModerator = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', userId)
    .single()
  if (error) {
    console.error('Error checking moderator status:', error)
    return false
  }
  return data?.role === 'moderator' || data?.role === 'admin'
}

export const clearAuthData = async () => {
  try {
    await supabase.auth.signOut()
  } catch (error) {
    console.error('Error signing out:', error)
  } finally {
    localStorage.clear()
    sessionStorage.clear()
  }
}
export const logAuthSnapshot = async () => {
  const { data, error } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  console.log('[supabase] session:', {
    userId: data?.session?.user?.id ?? null,
    accessTokenLen: token ? token.length : 0,
    error: error?.message ?? null,
  })
}

