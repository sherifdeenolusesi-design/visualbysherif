export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Replicate from 'replicate'
import OpenAI from 'openai'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function POST(request: Request) {
  // Auth — accept token in Authorization header or body
  const auth  = request.headers.get('authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''

  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const bodyToken = body?.admin_token ?? ''
  if (token !== process.env.ADMIN_TOKEN && bodyToken !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const { title, content, excerpt, tags, slug, published, generate_image } = body

  if (!title || !content) {
    return NextResponse.json({ error: 'title and content are required.' }, { status: 400 })
  }

  let cover_image: string | null = null

  // Generate cover image with FLUX unless explicitly skipped
  if (generate_image !== false) {
    try {
      const openai    = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
      const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! })

      // Ask GPT-4o for a cinematic image prompt based on the blog title
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: `Create a short, vivid FLUX image generation prompt for a photography blog cover image.
Blog post title: "${title}"
Requirements:
- Cinematic, editorial photography style
- Beautiful natural or studio lighting
- No text, no people unless the subject is portraits
- Ultra high quality, 8K, professional
- Return ONLY the prompt, nothing else. Max 60 words.`,
        }],
        max_tokens: 100,
      })

      const imgPrompt = completion.choices[0].message.content?.trim() ?? `${title}, cinematic photography, beautiful light, editorial, 8K`

      const output = await replicate.run('black-forest-labs/flux-1.1-pro', {
        input: { prompt: imgPrompt, aspect_ratio: '16:9', output_format: 'webp', output_quality: 90 },
      })
      cover_image = String(Array.isArray(output) ? output[0] : output)
    } catch (imgErr: any) {
      console.error('[n8n-blog] image generation failed:', imgErr?.message)
      // Continue without image rather than failing the whole post
    }
  }

  const isPublished = published === true || published === 'true'
  const finalSlug   = slug ? slugify(slug) : slugify(title)

  const { data, error } = await adminClient()
    .from('blog_posts')
    .insert({
      title,
      slug:        finalSlug,
      content,
      excerpt:     excerpt ?? '',
      tags:        Array.isArray(tags) ? tags : (tags ? [tags] : []),
      cover_image,
      published:   isPublished,
      published_at: isPublished ? new Date().toISOString() : null,
    })
    .select()
    .single()

  if (error) {
    console.error('[n8n-blog] supabase error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, post: data }, { status: 201 })
}
