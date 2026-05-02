import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rm } from 'fs/promises'
import path from 'path'

export async function DELETE(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id')
  if (!sessionId) return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })

  const supabase = createClient()

  // Delete all photo records for this session
  await supabase.from('session_photos').delete().eq('session_id', sessionId)
  // Also clear any selections
  await supabase.from('photo_selections').delete().eq('session_id', sessionId)

  // Remove uploaded files from disk
  const uploadDir = path.join(process.cwd(), 'uploads', 'conference', sessionId)
  try {
    await rm(uploadDir, { recursive: true, force: true })
  } catch { /* directory may not exist */ }

  return NextResponse.json({ ok: true })
}
