export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import Replicate from 'replicate'
import { checkRateLimit, sanitizeString, SECURE_HEADERS } from '@/lib/security'

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = checkRateLimit(`planner:${ip}`, 15, 60 * 60 * 1000)
  if (!rl.allowed) return NextResponse.json({ error: 'Rate limit reached.' }, { status: 429, headers: SECURE_HEADERS })

  let raw: unknown
  try { raw = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400, headers: SECURE_HEADERS })
  }

  const service = sanitizeString((raw as any)?.service, 100)
  const outfit  = sanitizeString((raw as any)?.outfit, 500)
  const style   = sanitizeString((raw as any)?.style, 100)
  const colors  = sanitizeString((raw as any)?.colors, 200)
  const location = sanitizeString((raw as any)?.location, 200)

  if (!service || !outfit) {
    return NextResponse.json({ error: 'Service and outfit are required.' }, { status: 400, headers: SECURE_HEADERS })
  }

  try {
    const openai    = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! })

    // Generate strategy with GPT-4o
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a world-class photography director and stylist with 20 years of experience in fashion, portrait, and commercial photography.
Generate highly detailed, practical, and creative shooting strategies.
Always return valid JSON matching exactly the structure requested.
Be specific, professional, and inspiring. Think like a top fashion magazine director.`,
        },
        {
          role: 'user',
          content: `Create a complete professional photography shooting strategy for:

Service: ${service}
Client outfit: ${outfit}
Desired style: ${style || 'cinematic and editorial'}
Color palette preference: ${colors || 'not specified'}
Location preference: ${location || 'flexible'}

Return JSON with this exact structure:
{
  "creativeDirection": "2-3 sentences describing the overall creative vision",
  "mood": "one word mood (e.g. Dramatic, Soft, Bold, Ethereal)",
  "lightingSetup": {
    "type": "lighting style name",
    "description": "detailed lighting description",
    "equipment": ["item1", "item2"],
    "naturalLight": true or false,
    "goldenHourRecommended": true or false
  },
  "shotList": ["shot 1 description", "shot 2", "shot 3", "shot 4", "shot 5", "shot 6"],
  "poses": ["pose 1 description", "pose 2", "pose 3", "pose 4", "pose 5"],
  "locations": [
    { "name": "location name", "why": "why it suits the outfit and style" },
    { "name": "location name", "why": "why it suits the outfit and style" },
    { "name": "location name", "why": "why it suits the outfit and style" }
  ],
  "colorGrading": "specific color grading approach for post-processing",
  "backgroundStyles": ["background style 1", "background style 2", "background style 3"],
  "props": ["prop 1", "prop 2", "prop 3"],
  "outfitTips": ["tip 1 about the outfit", "tip 2", "tip 3"],
  "shootingTips": ["technical tip 1", "tip 2", "tip 3"],
  "inspirationImagePrompt": "detailed FLUX/AI image generation prompt to create an inspiration photo matching this shoot style, outfit, and mood. Be very specific about lighting, environment, mood, colors."
}`,
        },
      ],
    })

    const strategy = JSON.parse(completion.choices[0].message.content ?? '{}')

    // Generate 2 inspiration images with FLUX in parallel
    const imagePrompt = `${strategy.inspirationImagePrompt ?? `${style} photography, ${outfit}, professional ${service} photoshoot, ${colors || 'rich tones'}`}. Ultra high quality, professional photography, award-winning, cinematic.`

    const [img1, img2] = await Promise.all([
      replicate.run('black-forest-labs/flux-1.1-pro', {
        input: { prompt: imagePrompt, aspect_ratio: '2:3', output_format: 'webp', output_quality: 95 },
      }),
      replicate.run('black-forest-labs/flux-1.1-pro', {
        input: { prompt: imagePrompt + ' different angle, wider shot', aspect_ratio: '16:9', output_format: 'webp', output_quality: 95 },
      }),
    ])

    return NextResponse.json({
      strategy,
      inspirationImages: [String(img1), String(img2)],
    }, { headers: SECURE_HEADERS })
  } catch (err: any) {
    console.error('[shoot-planner]', err?.message, err?.response?.data)
    return NextResponse.json({ error: err?.message ?? 'Failed to generate strategy.' }, { status: 500, headers: SECURE_HEADERS })
  }
}
