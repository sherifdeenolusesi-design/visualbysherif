export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  const query = admin().from('contracts')
  const { data, error } = id
    ? await query.select('*').eq('id', id)
    : await query.select('id, ref, client_name, client_email, project_type, event_date, total_amount, deposit_amount, status, created_at').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ contracts: data })
}

export async function POST(req: Request) {
  const body = await req.json()
  const { ref, form_data, client_sig, photographer_sig } = body
  const total = parseFloat(form_data.totalAmount) || 0
  const deposit = total * (parseFloat(form_data.depositPct) || 30) / 100

  const { data, error } = await admin().from('contracts').insert({
    ref,
    client_name:      form_data.clientName,
    client_email:     form_data.clientEmail,
    project_type:     form_data.projectType,
    event_date:       form_data.eventDate || null,
    total_amount:     total,
    deposit_amount:   deposit,
    status:           client_sig && photographer_sig ? 'signed' : 'draft',
    form_data,
    client_sig:       client_sig || null,
    photographer_sig: photographer_sig || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ contract: data }, { status: 201 })
}

export async function DELETE(req: Request) {
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { error } = await admin().from('contracts').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
