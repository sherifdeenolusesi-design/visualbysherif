import Link from 'next/link'
import { redirect } from 'next/navigation'
import Stripe from 'stripe'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Order Confirmed — Visual by Sherif' }

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

function fmt(pence: number, currency = 'gbp') {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(pence / 100)
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string }
}) {
  const sessionId = searchParams.session_id
  if (!sessionId || !/^cs_/.test(sessionId)) redirect('/shop')

  let session: Stripe.Checkout.Session | null = null
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'payment_intent'],
    })
  } catch {
    redirect('/shop')
  }

  if (session.payment_status !== 'paid') redirect('/shop')

  const cust = session.customer_details
  const ship = session.shipping_details
  const items = session.line_items?.data ?? []
  const pi = session.payment_intent as Stripe.PaymentIntent | null

  return (
    <div className="min-h-screen pt-16 bg-zinc-950">
      <div className="max-w-2xl mx-auto px-4 py-20">

        {/* Animated check */}
        <div className="flex justify-center mb-10">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border border-zinc-700 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="absolute inset-0 rounded-full border border-zinc-600 animate-ping opacity-20" />
          </div>
        </div>

        <h1 className="text-3xl font-thin text-white text-center mb-3">Order Confirmed</h1>
        <p className="text-zinc-500 text-sm text-center mb-12">
          Thank you{cust?.name ? `, ${cust.name.split(' ')[0]}` : ''}. Your print is on its way to production.
        </p>

        {/* Order details */}
        <div className="border border-zinc-800 divide-y divide-zinc-800">

          <div className="px-6 py-4 flex justify-between items-center">
            <span className="text-zinc-500 text-xs uppercase tracking-widest">Reference</span>
            <span className="text-white text-xs font-mono">{sessionId.slice(-12).toUpperCase()}</span>
          </div>

          {items.map((item) => (
            <div key={item.id} className="px-6 py-4 flex justify-between items-start">
              <div>
                <p className="text-white text-sm font-light">{item.description}</p>
                <p className="text-zinc-600 text-xs mt-0.5">Qty: {item.quantity}</p>
              </div>
              <p className="text-white text-sm">{fmt(item.amount_total, session!.currency!)}</p>
            </div>
          ))}

          <div className="px-6 py-4 flex justify-between items-center bg-zinc-900/50">
            <span className="text-white text-xs uppercase tracking-widest">Total Paid</span>
            <span className="text-white text-lg font-light">{fmt(session.amount_total ?? 0, session.currency!)}</span>
          </div>

          {(cust?.email || cust?.name) && (
            <div className="px-6 py-4 space-y-1">
              <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Customer</p>
              {cust.name && <p className="text-white text-sm">{cust.name}</p>}
              {cust.email && <p className="text-zinc-400 text-xs">{cust.email}</p>}
            </div>
          )}

          {ship?.address && (
            <div className="px-6 py-4">
              <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Ships To</p>
              <address className="not-italic text-zinc-400 text-sm space-y-0.5">
                {ship.name && <p className="text-white">{ship.name}</p>}
                {ship.address.line1 && <p>{ship.address.line1}</p>}
                {ship.address.line2 && <p>{ship.address.line2}</p>}
                <p>{[ship.address.city, ship.address.state, ship.address.postal_code].filter(Boolean).join(', ')}</p>
                {ship.address.country && <p>{ship.address.country}</p>}
              </address>
            </div>
          )}

          {pi && (
            <div className="px-6 py-4 flex justify-between items-center">
              <span className="text-zinc-500 text-xs uppercase tracking-widest">Payment</span>
              <span className="text-zinc-400 text-xs font-mono">{String(pi.id).slice(-8).toUpperCase()}</span>
            </div>
          )}
        </div>

        {/* Fulfilment timeline */}
        <div className="mt-8 border border-zinc-800 p-6">
          <p className="text-zinc-500 text-xs uppercase tracking-widest mb-4">What Happens Next</p>
          <ol className="space-y-4">
            {[
              { label: 'Order received', done: true, note: 'Confirmation sent to ' + (cust?.email ?? 'your email') },
              { label: 'Print production', done: false, note: '1–2 business days' },
              { label: 'Quality check', done: false, note: 'Professionally inspected before dispatch' },
              { label: 'Dispatched', done: false, note: 'Arrives within 5–7 business days' },
            ].map((step, i) => (
              <li key={i} className="flex gap-4 items-start">
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 ${step.done ? 'border-white bg-white' : 'border-zinc-700'}`}>
                  {step.done && (
                    <svg className="w-3 h-3 text-zinc-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className={`text-sm ${step.done ? 'text-white' : 'text-zinc-500'}`}>{step.label}</p>
                  <p className="text-zinc-600 text-xs mt-0.5">{step.note}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex gap-4 mt-8">
          <Link href="/shop" className="flex-1 text-center border border-zinc-800 text-zinc-400 py-3.5 text-xs uppercase tracking-widest hover:border-zinc-600 hover:text-white transition-colors">
            Back to Shop
          </Link>
          <Link href="/" className="flex-1 text-center bg-white text-zinc-950 py-3.5 text-xs uppercase tracking-widest hover:bg-zinc-100 transition-colors">
            Home
          </Link>
        </div>

      </div>
    </div>
  )
}
