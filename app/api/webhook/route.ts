import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyStripeSignature, SECURE_HEADERS } from '@/lib/security'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

// Stripe requires the RAW request body for signature verification.
// If you use a body parser middleware it will break — this route must stay as-is.
export async function POST(request: Request) {
  const rawBody = await request.text()
  const sig = headers().get('stripe-signature') ?? ''
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? ''

  if (!secret) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  // ── HMAC-SHA256 signature check (prevents spoofed webhook calls) ──────────
  // We verify manually AND via Stripe SDK for defence-in-depth.
  if (!verifyStripeSignature(rawBody, sig, secret)) {
    console.warn('[webhook] Signature mismatch — possible spoofed request')
    return NextResponse.json({ error: 'Signature invalid' }, { status: 400, headers: SECURE_HEADERS })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret)
  } catch (err: any) {
    console.error('[webhook] SDK verification failed:', err.message)
    return NextResponse.json({ error: 'Verification failed' }, { status: 400, headers: SECURE_HEADERS })
  }

  // ── Handle events ─────────────────────────────────────────────────────────
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.payment_status === 'paid') {
          await recordOrder(session)
        }
        break
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent
        console.warn('[webhook] Payment failed:', pi.id, pi.last_payment_error?.message)
        break
      }
      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute
        console.warn('[webhook] Dispute raised:', dispute.id, dispute.reason)
        await flagDispute(dispute)
        break
      }
    }
  } catch (err: any) {
    console.error('[webhook] Handler error:', err.message)
    // Return 200 so Stripe does not retry endlessly — log and investigate manually
  }

  return NextResponse.json({ received: true }, { headers: SECURE_HEADERS })
}

// ─── Record completed order (idempotent via upsert) ───────────────────────────
async function recordOrder(session: Stripe.Checkout.Session) {
  const supabase = createAdminClient()
  const meta = session.metadata ?? {}
  const ship = session.shipping_details
  const cust = session.customer_details

  const { error } = await supabase.from('orders').upsert(
    {
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent as string | null,
      stripe_customer_id: session.customer as string | null,
      product_id: meta.product_id ?? null,
      product_title: meta.product_title ?? null,
      size: meta.size ?? '',
      quantity: parseInt(meta.quantity ?? '1', 10),
      amount_total: session.amount_total ?? 0,
      currency: session.currency ?? 'gbp',
      customer_name: cust?.name ?? null,
      customer_email: cust?.email ?? '',
      shipping_name: ship?.name ?? null,
      shipping_line1: ship?.address?.line1 ?? null,
      shipping_line2: ship?.address?.line2 ?? null,
      shipping_city: ship?.address?.city ?? null,
      shipping_state: ship?.address?.state ?? null,
      shipping_postal_code: ship?.address?.postal_code ?? null,
      shipping_country: ship?.address?.country ?? null,
      status: 'paid',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'stripe_session_id' }
  )

  if (error) {
    console.error('[webhook] Failed to record order:', error.message)
    return
  }

  // Decrement stock safely via RPC (handles concurrent orders)
  if (meta.product_id) {
    const qty = parseInt(meta.quantity ?? '1', 10)
    const { error: stockErr } = await supabase.rpc('decrement_stock', {
      p_product_id: meta.product_id,
      p_qty: qty,
    })
    if (stockErr) console.error('[webhook] Stock decrement failed:', stockErr.message)
  }

  console.log('[webhook] Order recorded:', session.id, cust?.email)
}

// ─── Flag disputed charge ─────────────────────────────────────────────────────
async function flagDispute(dispute: Stripe.Dispute) {
  const supabase = createAdminClient()
  await supabase
    .from('orders')
    .update({ status: 'disputed', updated_at: new Date().toISOString() })
    .eq('stripe_payment_intent_id', dispute.payment_intent as string)
}
