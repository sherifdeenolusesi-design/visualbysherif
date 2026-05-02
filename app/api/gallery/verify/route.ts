import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Uses service role to bypass RLS and read private gallery data
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const { slug, password } = await request.json()

  if (!slug || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { data: gallery } = await supabaseAdmin
    .from('client_galleries')
    .select('id, password_hash')
    .eq('slug', slug)
    .single()

  if (!gallery) {
    return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
  }

  // Direct comparison — store hashed passwords in production via Supabase Edge Function
  if (gallery.password_hash !== password) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }

  const { data: photos } = await supabaseAdmin
    .from('client_gallery_photos')
    .select('*')
    .eq('gallery_id', gallery.id)
    .order('created_at', { ascending: true })

  return NextResponse.json({ photos: photos || [] })
}
