import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const sessionId = formData.get('session_id') as string
  const files = formData.getAll('files') as File[]

  if (!sessionId || !files.length) {
    return NextResponse.json({ error: 'Missing session_id or files' }, { status: 400 })
  }

  const supabase = adminClient()

  // Ensure bucket exists
  await supabase.storage.createBucket('conference-photos', { public: true }).catch(() => {})

  const { count } = await supabase
    .from('session_photos')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId)

  const baseIndex = count ?? 0

  // Upload all files in parallel
  const results = await Promise.all(
    files.map(async (file, i) => {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
      const storagePath = `${sessionId}/${Date.now()}-${i}.${ext}`
      const buffer = Buffer.from(await file.arrayBuffer())

      const { error: uploadError } = await supabase.storage
        .from('conference-photos')
        .upload(storagePath, buffer, {
          contentType: file.type || 'image/jpeg',
          upsert: false,
        })

      if (uploadError) {
        console.error('[conference/upload] storage error:', uploadError.message)
        return null
      }

      const { data: { publicUrl } } = supabase.storage
        .from('conference-photos')
        .getPublicUrl(storagePath)

      const { data, error } = await supabase
        .from('session_photos')
        .insert({
          session_id: sessionId,
          photo_url: publicUrl,
          storage_path: storagePath,
          filename: file.name,
          order_index: baseIndex + i,
        })
        .select()
        .single()

      if (error) {
        console.error('[conference/upload] db error:', error.message)
        return null
      }

      return data
    })
  )

  const uploaded = results.filter(Boolean)
  return NextResponse.json({ uploaded })
}
