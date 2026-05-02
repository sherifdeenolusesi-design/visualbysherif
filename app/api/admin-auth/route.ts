import { NextResponse } from 'next/server'

const COOKIE_OPTS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path:     '/',
  maxAge:   60 * 60 * 24 * 7, // 7 days
}

export async function POST(request: Request) {
  const { password } = await request.json().catch(() => ({ password: '' }))

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 })
  }

  const token    = process.env.ADMIN_TOKEN!
  const response = NextResponse.json({ ok: true })

  // httpOnly cookie — checked by middleware
  response.cookies.set('vbs_admin', token, COOKIE_OPTS)
  // readable by navbar JS to show/hide menus
  response.cookies.set('vbs_admin_ui', '1', { ...COOKIE_OPTS, httpOnly: false })

  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set('vbs_admin',    '', { ...COOKIE_OPTS, maxAge: 0 })
  response.cookies.set('vbs_admin_ui', '', { ...COOKIE_OPTS, maxAge: 0, httpOnly: false })
  return response
}
