import { supabase } from './supabaseClient'

function LogoutButton() {
  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return <button onClick={handleLogout}>Sign Out</button>
}

export default LogoutButton