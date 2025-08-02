import React from 'react'
import { useAuth } from './hooks/useAuth'
import { Auth } from './pages/Auth'
import { Dashboard } from './pages/Dashboard'

function App() {
  const { user, loading, initialized } = useAuth()

  // Show loading screen while auth is being determined
  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Render Auth page if no user, Dashboard if authenticated
  if (!user) return <Auth />
  return <Dashboard />
}

export default App