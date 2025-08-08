// supabase/functions/delete-user/index.ts

import { serve } from 'https://deno.land/std@0.192.0/http/server.ts'

serve(async (req) => {
  const { user_id } = await req.json()

  if (!user_id) {
    return new Response(JSON.stringify({ error: 'Missing user_id' }), { status: 400 })
  }

  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')

  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user_id}`, {
    method: 'DELETE',
    headers: {
      apikey: SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    const error = await res.json()
    return new Response(JSON.stringify({ error }), { status: res.status })
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 })
})
