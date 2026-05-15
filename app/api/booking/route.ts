import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(request: Request) {
  const body = await request.json()
  const { name, email, phone, session_type, preferred_date, message } = body

  if (!name || !email || !session_type || !preferred_date) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = createClient()

  const { error } = await supabase.from('bookings').insert({
    name,
    email,
    phone: phone || null,
    session_type,
    preferred_date,
    message: message || null,
    status: 'pending',
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Send notification email to photographer
  try {
    const formattedDate = new Date(preferred_date).toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
    await resend.emails.send({
      from: 'Booking Notifications <onboarding@resend.dev>',
      to: 'visualbysherif@gmail.com',
      subject: `New Booking Request — ${session_type} — ${name}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
          <h2 style="margin-bottom:4px">New Booking Request</h2>
          <p style="color:#555;margin-top:0">Submitted via visualsbysherif.com</p>
          <table style="width:100%;border-collapse:collapse;margin-top:20px">
            <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#555;width:140px">Name</td><td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600">${name}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#555">Email</td><td style="padding:10px 0;border-bottom:1px solid #eee"><a href="mailto:${email}">${email}</a></td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#555">Phone</td><td style="padding:10px 0;border-bottom:1px solid #eee">${phone || '—'}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#555">Session Type</td><td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600">${session_type}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#555">Preferred Date</td><td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600">${formattedDate}</td></tr>
            ${message ? `<tr><td style="padding:10px 0;color:#555;vertical-align:top">Message</td><td style="padding:10px 0">${message.replace(/\n/g, '<br>')}</td></tr>` : ''}
          </table>
          <p style="margin-top:28px;color:#888;font-size:13px">Reply directly to <a href="mailto:${email}">${email}</a> to respond to this client.</p>
        </div>
      `,
    })
  } catch (mailErr) {
    // Don't fail the booking if email fails — log and continue
    console.error('[booking] email notification failed:', mailErr)
  }

  return NextResponse.json({ success: true })
}
