import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import {
  checkRateLimit,
  sanitizeString,
  sanitizeSize,
  sanitizePositiveInt,
  isValidUUID,
  SECURE_HEADERS,
} from '@/lib/security'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

const ALLOWED_COUNTRIES: Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[] = [
  'GB', 'US', 'CA', 'AU', 'IE', 'DE', 'FR', 'NL', 'SE', 'NO', 'DK',
]

export async function POST(request: Request) {
  // ── Rate limiting: 8 checkout attempts per IP per 10 min ──────────────────
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  const rl = checkRateLimit(`checkout:${ip}`, 8, 10 * 60 * 1000)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a few minutes and try again.' },
      { status: 429, headers: { ...SECURE_HEADERS, 'Retry-After': '600' } }
    )
  }

  // ── Parse & sanitize input ─────────────────────────────────────────────────
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400, headers: SECURE_HEADERS })
  }

  const productId = sanitizeString((raw as any)?.product_id)
  const size = sanitizeSize((raw as any)?.size)   // preserves inch symbol " in sizes like 24x30"
  const quantity = sanitizePositiveInt((raw as any)?.quantity, 1, 10)

  if (!isValidUUID(productId)) {
    return NextResponse.json({ error: 'Invalid product.' }, { status: 400, headers: SECURE_HEADERS })
  }
  if (!size) {
    return NextResponse.json({ error: 'Please select a size.' }, { status: 400, headers: SECURE_HEADERS })
  }

  // ── Fetch product from DB — PRICE IS ALWAYS SERVER-SIDE ───────────────────
  const supabase = createClient()
  const { data: product } = await supabase
    .from('print_products')
    .select('id, title, price, sizes, stock, image_url, description')
    .eq('id', productId)
    .gt('stock', 0)
    .single()

  if (!product) {
    return NextResponse.json({ error: 'Product not found or out of stock.' }, { status: 404, headers: SECURE_HEADERS })
  }

  if (!Array.isArray(product.sizes) || !product.sizes.includes(size)) {
    return NextResponse.json({ error: 'Invalid size for this product.' }, { status: 400, headers: SECURE_HEADERS })
  }

  if (quantity > product.stock) {
    return NextResponse.json({ error: `Only ${product.stock} in stock.` }, { status: 400, headers: SECURE_HEADERS })
  }

  // Stripe requires a publicly accessible HTTPS URL — relative paths will be rejected.
  // Only pass image if it's already an absolute https:// URL.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const imageUrl = product.image_url
    ? product.image_url.startsWith('http')
      ? product.image_url                          // already absolute
      : siteUrl.startsWith('https')
        ? `${siteUrl}${product.image_url}`         // make absolute using production URL
        : undefined                                // localhost — skip image (Stripe can't reach it)
    : undefined

  // ── Create Stripe Checkout session ────────────────────────────────────────
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `${product.title} — ${size}`,
              description: product.description ?? 'Museum-quality fine art print on archival paper',
              ...(imageUrl ? { images: [imageUrl] } : {}),
            },
            unit_amount: product.price, // pence — always from DB, never the client
          },
          quantity,
        },
      ],
      mode: 'payment',
      billing_address_collection: 'required',
      shipping_address_collection: { allowed_countries: ALLOWED_COUNTRIES },
      phone_number_collection: { enabled: false },
      customer_creation: 'always',
      payment_intent_data: {
        description: `Visual by Sherif — ${product.title} (${size})`,
        metadata: { product_id: product.id, size, quantity: String(quantity) },
      },
      success_url: `${siteUrl}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/shop/${productId}?cancelled=1`,
      metadata: {
        product_id: product.id,
        product_title: product.title,
        size,
        quantity: String(quantity),
      },
    })

    return NextResponse.json({ url: session.url }, { headers: SECURE_HEADERS })
  } catch (err: any) {
    // Log the real Stripe error — visible in your terminal
    const stripeMsg = err?.raw?.message ?? err?.message ?? 'Unknown error'
    const stripeCode = err?.raw?.code ?? err?.statusCode ?? ''
    console.error(`[checkout] Stripe error ${stripeCode}: ${stripeMsg}`)

    // In development, surface the real reason so you can fix it faster
    const isDev = process.env.NODE_ENV === 'development'
    return NextResponse.json(
      { error: isDev ? `Stripe: ${stripeMsg}` : 'Could not start checkout. Please try again.' },
      { status: 500, headers: SECURE_HEADERS }
    )
  }
}
