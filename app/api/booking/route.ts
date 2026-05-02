import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const body = await request.json()
  const { name, email, phone, session_type, preferred_date, message } = body

  if (!name || !email || !session_type || !preferred_date) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = createClient()

  const { error } = await supabase.from('bookings').insert({
    name,
    email,
    phone: phone || null,
    session_type,
    preferred_date,
    message: message || null,
    status: 'pending',
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
