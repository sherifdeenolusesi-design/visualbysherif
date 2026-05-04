export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import Replicate from 'replicate'
import { checkRateLimit, sanitizeString, SECURE_HEADERS } from '@/lib/security'

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = checkRateLimit(`retouch:${ip}`, 30, 60 * 60 * 1000)
  if (!rl.allowed) return NextResponse.json({ error: 'Rate limit reached.' }, { status: 429, headers: SECURE_HEADERS })

  let formData: FormData
  try { formData = await request.formData() } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400, headers: SECURE_HEADERS })
  }

  const operation = sanitizeString(formData.get('operation') as string ?? '', 50)
  const imageFile = formData.get('image') as File | null

  if (!operation || !imageFile) {
    return NextResponse.json({ error: 'Operation and image are required.' }, { status: 400, headers: SECURE_HEADERS })
  }

  try {
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! })
    const bytes  = await imageFile.arrayBuffer()
    const blob   = new Blob([bytes], { type: imageFile.type || 'image/jpeg' })

    // ── AI Skin Enhancement (GFPGAN) ──────────────────────────────────────
    if (operation === 'enhance') {
      const output = await replicate.run(
        'tencentarc/gfpgan:0fbacf7afc6c144e5be9767cff80f25aff23e52b0708f17e20f9879b2f21516c',
        { input: { img: blob, version: 'v1.4', scale: 2 } }
      )
      return NextResponse.json({ url: String(Array.isArray(output) ? output[0] : output) }, { headers: SECURE_HEADERS })
    }

    // ── AI Face Restore (CodeFormer) ──────────────────────────────────────
    if (operation === 'restore') {
      const output = await replicate.run(
        'sczhou/codeformer:cc4956dd26fa5a7185d5660cc9100fab1b8070a1d1654a8bb5eb6d443b020bb2',
        { input: { image: blob, codeformer_fidelity: 0.7, background_enhance: true, face_upsample: true, upscale: 2 } }
      )
      return NextResponse.json({ url: String(Array.isArray(output) ? output[0] : output) }, { headers: SECURE_HEADERS })
    }

    // ── AI Upscale 4× (Real-ESRGAN) ──────────────────────────────────────
    if (operation === 'upscale') {
      const output = await replicate.run(
        'nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b',
        { input: { image: blob, scale: 4, face_enhance: true } }
      )
      return NextResponse.json({ url: String(Array.isArray(output) ? output[0] : output) }, { headers: SECURE_HEADERS })
    }

    return NextResponse.json({ error: 'Unknown operation.' }, { status: 400, headers: SECURE_HEADERS })
  } catch (err: any) {
    console.error('[photo-retouch]', err?.message)
    return NextResponse.json({ error: err?.message ?? 'Processing failed.' }, { status: 500, headers: SECURE_HEADERS })
  }
}
