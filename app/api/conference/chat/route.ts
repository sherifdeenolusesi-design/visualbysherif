import { NextRequest, NextResponse } from 'next/server'
import { readFile, writeFile, mkdir } from 'fs/promises'
import path from 'path'

interface Message {
  id: string
  sender: string
  role: string
  text: string
  sent_at: string
}

async function getMessagesFile(sessionId: string): Promise<string> {
  const dir = path.join(process.cwd(), 'uploads', 'conference', sessionId)
  await mkdir(dir, { recursive: true })
  return path.join(dir, 'messages.json')
}

async function readMessages(sessionId: string): Promise<Message[]> {
  try {
    const file = await getMessagesFile(sessionId)
    const raw = await readFile(file, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id')
  if (!sessionId) return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
  const messages = await readMessages(sessionId)
  return NextResponse.json({ messages })
}

export async function POST(req: NextRequest) {
  const { session_id, sender, role, text } = await req.json()
  if (!session_id || !text?.trim()) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  const messages = await readMessages(session_id)
  const msg: Message = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    sender,
    role,
    text: text.trim(),
    sent_at: new Date().toISOString(),
  }
  messages.push(msg)
  const file = await getMessagesFile(session_id)
  await writeFile(file, JSON.stringify(messages, null, 2))
  return NextResponse.json({ message: msg })
}
