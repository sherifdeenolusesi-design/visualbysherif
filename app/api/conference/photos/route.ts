import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id')
  if (!sessionId) return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })

  const supabase = createClient()
  const { data: photos } = await supabase
    .from('session_photos')
    .select('*')
    .eq('session_id', sessionId)
    .order('order_index', { ascending: true })

  return NextResponse.json({ photos: photos ?? [] })
}
