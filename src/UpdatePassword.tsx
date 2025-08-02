import { useState } from 'react'
import { supabase } from './supabaseClient'

function UpdatePassword() {
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) setMsg(error.message)
    else setMsg('Password updated successfully')
  }

  return (
    <form onSubmit={handleUpdate}>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Update Password</button>
      {msg && <p>{msg}</p>}
    </form>
  )
}

export default UpdatePassword