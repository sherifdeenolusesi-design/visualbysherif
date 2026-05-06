import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id')
  if (!sessionId) return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })

  const supabase = adminClient()
  const { data, error } = await supabase
    .from('conference_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('sent_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ messages: data ?? [] })
}

export async function POST(req: NextRequest) {
  const { session_id, sender, role, text } = await req.json()
  if (!session_id || !text?.trim()) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const supabase = adminClient()
  const { data, error } = await supabase
    .from('conference_messages')
    .insert({ session_id, sender, role, text: text.trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: data })
}
