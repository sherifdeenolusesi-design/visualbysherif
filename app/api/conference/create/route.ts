import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const body = await request.json()
  const { session_name, client_email, client_name } = body

  if (!session_name?.trim()) {
    return NextResponse.json({ error: 'Session name is required' }, { status: 400 })
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from('conference_sessions')
    .insert({
      session_name: session_name.trim(),
      client_email: client_email || null,
      client_name: client_name || null,
      status: 'active',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
