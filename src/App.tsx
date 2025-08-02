import { useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-ts'
import { supabase } from './lib/supabase'
import { Auth } from './pages/Auth'
import { Dashboard } from './pages/Dashboard'

function App() {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  if (!session) return <Auth />
  return <Dashboard />
}

export default App