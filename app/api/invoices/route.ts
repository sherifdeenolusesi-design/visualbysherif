export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  const query = admin().from('invoices')
  const { data, error } = id
    ? await query.select('*').eq('id', id)
    : await query.select('id, invoice_no, client_name, client_email, session_type, session_date, total_amount, status, created_at').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ invoices: data })
}

export async function POST(req: Request) {
  const body = await req.json()
  const { invoice_no, form, items, total_amount, bank_details } = body
  const { data, error } = await admin().from('invoices').insert({
    invoice_no,
    client_name:   form.clientName,
    client_email:  form.clientEmail,
    session_type:  form.sessionType,
    session_date:  form.sessionDate || null,
    total_amount,
    status:        'unpaid',
    form_data:     form,
    items,
    bank_details:  bank_details || null,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ invoice: data }, { status: 201 })
}

export async function PATCH(req: Request) {
  const { id, status } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { data, error } = await admin().from('invoices').update({ status }).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ invoice: data })
}

export async function DELETE(req: Request) {
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { error } = await admin().from('invoices').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
