import { useState } from 'react'
import { supabase } from './supabaseClient'

function ResetPassword() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/update-password',
    })
    if (error) setMsg(error.message)
    else setMsg('Check your email for the reset link')
  }

  return (
    <form onSubmit={handleReset}>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <button type="submit">Reset Password</button>
      {msg && <p>{msg}</p>}
    </form>
  )
}

export default ResetPassword