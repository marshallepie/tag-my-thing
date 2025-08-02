import { useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from './src/supabaseClient'
import Login from './src/Login'
import Dashboard from './src/Dashboard'
import CheckEmail from './src/pages/CheckEmail'

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

  if (!session) return <Login />
  return <Dashboard />
}

export default App