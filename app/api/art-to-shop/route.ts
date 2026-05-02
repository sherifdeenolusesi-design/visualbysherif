import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sanitizeString, sanitizePositiveInt, SECURE_HEADERS } from '@/lib/security'

export async function POST(request: Request) {
  let raw: unknown
  try { raw = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400, headers: SECURE_HEADERS })
  }

  const imageUrl   = sanitizeString((raw as any)?.image_url, 2000)
  const title      = sanitizeString((raw as any)?.title, 200)
  const description = sanitizeString((raw as any)?.description, 1000)
  const category   = sanitizeString((raw as any)?.category, 100)
  const pricePence = sanitizePositiveInt((raw as any)?.price_pence, 100, 1000000)
  const stock      = sanitizePositiveInt((raw as any)?.stock, 1, 9999)
  const sizesRaw   = (raw as any)?.sizes

  if (!imageUrl || !imageUrl.startsWith('http')) {
    return NextResponse.json({ error: 'Invalid image URL.' }, { status: 400, headers: SECURE_HEADERS })
  }
  if (!title || title.length < 2) {
    return NextResponse.json({ error: 'Title is required.' }, { status: 400, headers: SECURE_HEADERS })
  }
  if (!Array.isArray(sizesRaw) || sizesRaw.length === 0) {
    return NextResponse.json({ error: 'Select at least one print size.' }, { status: 400, headers: SECURE_HEADERS })
  }

  const sizes = sizesRaw.map((s: unknown) => sanitizeString(String(s), 30)).filter(Boolean)

  // Download image from DALL-E temporary URL and upload to Supabase Storage
  let storedUrl = imageUrl
  try {
    const supabase = createAdminClient()

    const imgResponse = await fetch(imageUrl)
    if (!imgResponse.ok) throw new Error('Failed to fetch image')

    const buffer    = await imgResponse.arrayBuffer()
    const fileName  = `ai-art/${Date.now()}-${Math.random().toString(36).slice(2)}.png`
    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(fileName, buffer, { contentType: 'image/png', upsert: false })

    if (!uploadError) {
      const { data } = supabase.storage.from('products').getPublicUrl(fileName)
      storedUrl = data.publicUrl
    }
  } catch (uploadErr) {
    // If storage upload fails, fall back to original URL (temporary but still usable)
    console.warn('[art-to-shop] Storage upload failed, using original URL:', uploadErr)
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('print_products')
    .insert({
      title,
      description,
      category:  category || 'AI Fine Art',
      price:     pricePence,
      sizes,
      stock,
      image_url: storedUrl,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[art-to-shop] DB error:', error.message)
    return NextResponse.json({ error: 'Failed to save product.' }, { status: 500, headers: SECURE_HEADERS })
  }

  return NextResponse.json({ id: data.id, image_url: storedUrl }, { headers: SECURE_HEADERS })
}
