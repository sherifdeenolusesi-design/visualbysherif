import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const sessionId = formData.get('session_id') as string
  const files = formData.getAll('files') as File[]

  if (!sessionId || !files.length) {
    return NextResponse.json({ error: 'Missing session_id or files' }, { status: 400 })
  }

  // Save to uploads/ at project root (not public/) — served via /api/conference/image
  const uploadDir = path.join(process.cwd(), 'uploads', 'conference', sessionId)
  await mkdir(uploadDir, { recursive: true })

  const supabase = createClient()
  const inserted: object[] = []

  const { count } = await supabase
    .from('session_photos')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId)

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const ext = path.extname(file.name) || '.jpg'
    const safeName = `${Date.now()}-${i}${ext}`
    const filePath = path.join(uploadDir, safeName)
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    // URL served via API route — works reliably in dev and prod
    const photoUrl = `/api/conference/image?path=conference/${sessionId}/${safeName}`

    const { data, error } = await supabase
      .from('session_photos')
      .insert({
        session_id: sessionId,
        photo_url: photoUrl,
        storage_path: filePath,
        filename: file.name,
        order_index: (count ?? 0) + i,
      })
      .select()
      .single()

    if (!error && data) inserted.push(data)
  }

  return NextResponse.json({ uploaded: inserted })
}
