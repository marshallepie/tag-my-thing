import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import { Card } from './components/ui/Card'
import { Button } from './components/ui/Button'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setErrorMsg(error.message)
      } else {
        navigate('/dashboard')
      }
    } catch (err: any) {
      console.error('Login error:', err)
      setErrorMsg(err.message || 'Unexpected error occurred')
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/dashboard' },
      })
      if (error) {
        setErrorMsg(error.message)
      }
    } catch (err: any) {
      console.error('Google login error:', err)
      setErrorMsg(err.message || 'Unexpected error occurred')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 text-center">Login</h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring focus:ring-primary-200"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring focus:ring-primary-200"
          />
          <Button type="submit" className="w-full">
            Login
          </Button>
        </form>

        <div className="flex items-center justify-center">
          <Button onClick={handleGoogleLogin} variant="outline" className="w-full">
            Login with Google
          </Button>
        </div>

        {errorMsg && (
          <p className="text-red-500 text-sm text-center">{errorMsg}</p>
        )}
      </Card>
    </div>
  )
}

export default Login
