export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Replicate from 'replicate'
import OpenAI from 'openai'
import { checkRateLimit, SECURE_HEADERS } from '@/lib/security'

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// GET — list all posts
export async function GET() {
  const { data, error } = await adminClient()
    .from('blog_posts')
    .select('id, title, slug, excerpt, cover_image, published, published_at, tags, created_at')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: SECURE_HEADERS })
  return NextResponse.json({ posts: data }, { headers: SECURE_HEADERS })
}

// POST — create post (with optional AI image)
export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = checkRateLimit(`blog-admin:${ip}`, 20, 60 * 60 * 1000)
  if (!rl.allowed) return NextResponse.json({ error: 'Rate limit.' }, { status: 429, headers: SECURE_HEADERS })

  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400, headers: SECURE_HEADERS })
  }

  const { title, content, excerpt, tags, published, generate_image, custom_prompt } = body
  if (!title || !content) return NextResponse.json({ error: 'title and content required.' }, { status: 400, headers: SECURE_HEADERS })

  let cover_image: string | null = null
  if (generate_image) {
    try {
      const openai    = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
      const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! })
      let imgPrompt = custom_prompt ?? ''
      if (!imgPrompt) {
        const c = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: `Write a vivid FLUX image generation prompt for a photography blog post titled: "${title}". Cinematic, editorial style, beautiful lighting, no text. Max 60 words. Return the prompt only.` }],
          max_tokens: 100,
        })
        imgPrompt = c.choices[0].message.content?.trim() ?? title
      }
      const out = await replicate.run('black-forest-labs/flux-1.1-pro', {
        input: { prompt: imgPrompt + ', 16:9 composition, professional photography blog cover, 8K', aspect_ratio: '16:9', output_format: 'webp', output_quality: 90 },
      })
      cover_image = String(Array.isArray(out) ? out[0] : out)
    } catch (e: any) { console.error('[blog-admin] image gen failed:', e?.message) }
  }

  const isPublished = !!published
  const { data, error } = await adminClient().from('blog_posts').insert({
    title, content, excerpt: excerpt ?? '', tags: Array.isArray(tags) ? tags : [],
    slug: slugify(title), cover_image, published: isPublished,
    published_at: isPublished ? new Date().toISOString() : null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: SECURE_HEADERS })
  return NextResponse.json({ post: data }, { status: 201, headers: SECURE_HEADERS })
}

// PATCH — update post (publish toggle, cover image, content)
export async function PATCH(request: Request) {
  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400, headers: SECURE_HEADERS })
  }

  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'id required.' }, { status: 400, headers: SECURE_HEADERS })

  if (updates.published === true && !updates.published_at) {
    updates.published_at = new Date().toISOString()
  }
  if (updates.published === false) updates.published_at = null

  // Regenerate image if requested
  if (updates.generate_image && updates.title) {
    try {
      const openai    = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
      const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! })
      const c = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: `Write a vivid FLUX image prompt for a photography blog post titled: "${updates.title}". Cinematic, editorial, beautiful lighting, no text. Max 60 words. Return only the prompt.` }],
        max_tokens: 100,
      })
      const imgPrompt = c.choices[0].message.content?.trim() ?? updates.title
      const out = await replicate.run('black-forest-labs/flux-1.1-pro', {
        input: { prompt: imgPrompt, aspect_ratio: '16:9', output_format: 'webp', output_quality: 90 },
      })
      updates.cover_image = String(Array.isArray(out) ? out[0] : out)
    } catch (e: any) { console.error('[blog-admin] regen failed:', e?.message) }
    delete updates.generate_image
  }

  const { data, error } = await adminClient().from('blog_posts').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: SECURE_HEADERS })
  return NextResponse.json({ post: data }, { headers: SECURE_HEADERS })
}

// DELETE — remove post
export async function DELETE(request: Request) {
  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'id required.' }, { status: 400, headers: SECURE_HEADERS })
  const { error } = await adminClient().from('blog_posts').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: SECURE_HEADERS })
  return NextResponse.json({ success: true }, { headers: SECURE_HEADERS })
}
