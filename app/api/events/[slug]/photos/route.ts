import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'

const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp']

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const folder = path.join(process.cwd(), 'public', 'portfolio', 'events', params.slug)
  if (!fs.existsSync(folder)) {
    return NextResponse.json({ photos: [] })
  }
  const files = fs
    .readdirSync(folder)
    .filter((f) => IMAGE_EXTS.includes(path.extname(f).toLowerCase()))
    .sort()
  const photos = files.map((f) => ({
    url: `/portfolio/events/${params.slug}/${f}`,
    name: f,
  }))
  return NextResponse.json({ photos })
}
