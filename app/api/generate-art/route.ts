import { NextResponse } from 'next/server'
import Replicate from 'replicate'
import { checkRateLimit, sanitizeString, SECURE_HEADERS } from '@/lib/security'

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! })

const STYLE_ENHANCERS: Record<string, string> = {
  landscape:    'sweeping landscape fine art photography, golden hour light, dramatic clouds, rich colours, cinematic depth, 8K resolution',
  cityscape:    'architectural cityscape fine art, urban geometry, moody atmosphere, long exposure lights, editorial quality, sharp detail',
  abstract:     'abstract fine art painting, bold expressive colours, textured brushstrokes, contemporary gallery art, museum quality',
  portrait:     'fine art portrait photography, dramatic studio lighting, film grain, cinematic mood, award-winning, sharp eyes',
  seascape:     'dramatic seascape fine art, crashing waves, moody stormy sky, long exposure, deep contrast, photorealistic',
  nature:       'botanical nature fine art, macro photography, soft natural light, lush colours, museum quality print, razor sharp',
  architecture: 'architectural fine art photography, perfect symmetry, leading lines, dramatic perspective, black and white tones',
  minimal:      'minimalist fine art, negative space, clean lines, elegant geometric composition, monochromatic palette, high contrast',
  aerial:       'aerial fine art photography, birds eye view, geometric patterns, stunning perspective, drone photography, 8K',
  night:        'night fine art photography, star trails, long exposure, deep blues and purples, astrophotography, milky way detail',
}

const ASPECT_MAP: Record<string, string> = {
  landscape: '16:9',
  portrait:  '9:16',
  square:    '1:1',
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = checkRateLimit(`art-gen:${ip}`, 20, 60 * 60 * 1000)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit reached. Try again in an hour.' }, { status: 429, headers: SECURE_HEADERS })
  }

  let raw: unknown
  try { raw = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400, headers: SECURE_HEADERS })
  }

  const prompt      = sanitizeString((raw as any)?.prompt, 1000)
  const style       = sanitizeString((raw as any)?.style, 50)
  const aspectRatio = sanitizeString((raw as any)?.aspect_ratio, 20) || 'landscape'

  if (!prompt || prompt.length < 5) {
    return NextResponse.json({ error: 'Please describe your vision (at least 5 characters).' }, { status: 400, headers: SECURE_HEADERS })
  }

  const styleHint  = STYLE_ENHANCERS[style] ?? 'fine art photography, museum quality print, photorealistic'
  const replicateAspect = ASPECT_MAP[aspectRatio] ?? '16:9'

  const fullPrompt = `${prompt}. ${styleHint}. Ultra high resolution, fine art print quality, masterful composition, professional photography, rich tonal range, award-winning image, photorealistic.`

  try {
    const output = await replicate.run('black-forest-labs/flux-1.1-pro', {
      input: {
        prompt:             fullPrompt,
        aspect_ratio:       replicateAspect,
        output_format:      'webp',
        output_quality:     95,
        safety_tolerance:   2,
        prompt_upsampling:  true,
      },
    })

    // Replicate may return a URL object, array, or string — always extract a plain string
    let url: string
    if (Array.isArray(output)) {
      url = String(output[0])
    } else if (output && typeof (output as any).url === 'function') {
      url = (output as any).url().href
    } else {
      url = String(output)
    }

    console.log('[generate-art] URL:', url)
    return NextResponse.json({ url }, { headers: SECURE_HEADERS })
  } catch (err: any) {
    const msg = err?.message ?? 'Unknown error'
    console.error('[generate-art] Replicate error:', msg)
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'development' ? msg : 'Generation failed. Please try again.' },
      { status: 500, headers: SECURE_HEADERS }
    )
  }
}
