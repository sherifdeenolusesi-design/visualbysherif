export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import Replicate from 'replicate'
import { checkRateLimit, sanitizeString, SECURE_HEADERS } from '@/lib/security'

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = checkRateLimit(`photo-editor:${ip}`, 20, 60 * 60 * 1000)
  if (!rl.allowed) return NextResponse.json({ error: 'Rate limit reached.' }, { status: 429, headers: SECURE_HEADERS })

  let formData: FormData
  try { formData = await request.formData() } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400, headers: SECURE_HEADERS })
  }

  const operation = sanitizeString(formData.get('operation') as string ?? '', 50)
  const imageFile = formData.get('image') as File | null
  const prompt    = sanitizeString(formData.get('prompt') as string ?? '', 500)

  if (!operation) {
    return NextResponse.json({ error: 'Operation is required.' }, { status: 400, headers: SECURE_HEADERS })
  }

  try {
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! })

    // ── Remove Background ─────────────────────────────────────────────────
    if (operation === 'remove-bg') {
      if (!imageFile) return NextResponse.json({ error: 'Image is required.' }, { status: 400, headers: SECURE_HEADERS })
      // Convert File to Blob with explicit type
      const bytes = await imageFile.arrayBuffer()
      const blob  = new Blob([bytes], { type: imageFile.type || 'image/jpeg' })
      const output = await replicate.run(
        'cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003',
        { input: { image: blob } }
      )
      return NextResponse.json({ url: String(Array.isArray(output) ? output[0] : output) }, { headers: SECURE_HEADERS })
    }

    // ── Generate Background ───────────────────────────────────────────────
    if (operation === 'generate-bg') {
      if (!prompt) return NextResponse.json({ error: 'Describe the background you want.' }, { status: 400, headers: SECURE_HEADERS })
      const bgPrompt = `${prompt}, professional photography background, studio quality, high resolution, 8K, no people, empty scene, beautiful composition`
      const output = await replicate.run('black-forest-labs/flux-1.1-pro', {
        input: { prompt: bgPrompt, aspect_ratio: '2:3', output_format: 'webp', output_quality: 95 },
      })
      return NextResponse.json({ url: String(Array.isArray(output) ? output[0] : output) }, { headers: SECURE_HEADERS })
    }

    // ── Animate Photo (Image to Video) ────────────────────────────────────
    if (operation === 'animate') {
      if (!imageFile) return NextResponse.json({ error: 'Image is required.' }, { status: 400, headers: SECURE_HEADERS })
      const bytes = await imageFile.arrayBuffer()
      const blob  = new Blob([bytes], { type: imageFile.type || 'image/jpeg' })
      const motionPrompt = prompt || 'Gentle cinematic camera movement, smooth and professional, film quality'
      const output = await replicate.run('wan-ai/wan2.1-i2v-480p', {
        input: { image: blob, prompt: motionPrompt, max_area: '480*832', fast_mode: true, sample_steps: 20 },
      })
      return NextResponse.json({ url: String(Array.isArray(output) ? output[0] : output) }, { headers: SECURE_HEADERS })
    }

    // ── Generate Inspiration Backgrounds (themed) ─────────────────────────
    if (operation === 'inspire-bg') {
      if (!prompt) return NextResponse.json({ error: 'Describe the theme or mood.' }, { status: 400, headers: SECURE_HEADERS })
      const inspirePrompt = `${prompt}, cinematic photography backdrop, dramatic lighting, professional, ultra detailed, 8K, no people`
      const [p, l] = await Promise.all([
        replicate.run('black-forest-labs/flux-1.1-pro', {
          input: { prompt: inspirePrompt, aspect_ratio: '2:3', output_format: 'webp', output_quality: 95 },
        }),
        replicate.run('black-forest-labs/flux-1.1-pro', {
          input: { prompt: inspirePrompt + ', wide establishing shot', aspect_ratio: '16:9', output_format: 'webp', output_quality: 95 },
        }),
      ])
      return NextResponse.json({
        urls: [String(Array.isArray(p) ? p[0] : p), String(Array.isArray(l) ? l[0] : l)],
      }, { headers: SECURE_HEADERS })
    }

    return NextResponse.json({ error: 'Unknown operation.' }, { status: 400, headers: SECURE_HEADERS })
  } catch (err: any) {
    console.error('[photo-editor]', err?.message, err?.response?.data)
    return NextResponse.json({ error: err?.message ?? 'Processing failed.' }, { status: 500, headers: SECURE_HEADERS })
  }
}
