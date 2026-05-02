import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'

const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp']

export async function GET() {
  const root = path.join(process.cwd(), 'public', 'portfolio', 'events')
  if (!fs.existsSync(root)) return NextResponse.json({ events: [] })

  const events = fs
    .readdirSync(root)
    .filter((name) => fs.statSync(path.join(root, name)).isDirectory())
    .sort()
    .map((name) => {
      const folder = path.join(root, name)
      const count = fs
        .readdirSync(folder)
        .filter((f) => IMAGE_EXTS.includes(path.extname(f).toLowerCase())).length
      return { name, count }
    })

  return NextResponse.json({ events })
}
