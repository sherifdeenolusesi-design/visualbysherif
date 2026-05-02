import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

export async function GET(req: NextRequest) {
  const filePath = req.nextUrl.searchParams.get('path')
  if (!filePath) return NextResponse.json({ error: 'Missing path' }, { status: 400 })

  // Prevent path traversal
  const safe = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '')
  const abs = path.join(process.cwd(), 'uploads', safe)

  try {
    const buffer = await readFile(abs)
    const ext = path.extname(abs).toLowerCase()
    const mime =
      ext === '.png' ? 'image/png' :
      ext === '.webp' ? 'image/webp' :
      ext === '.gif' ? 'image/gif' :
      'image/jpeg'
    return new NextResponse(buffer, {
      headers: { 'Content-Type': mime, 'Cache-Control': 'public, max-age=31536000' },
    })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
