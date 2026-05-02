'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
type ProjectType = 'Wedding' | 'Event' | 'Portrait' | 'Commercial' | 'Newborn' | 'Other'

interface FormData {
  // Client
  clientName: string
  clientEmail: string
  clientPhone: string
  clientAddress: string
  // Project
  projectDescription: string
  projectType: ProjectType
  eventDate: string
  eventTime: string
  eventLocation: string
  duration: string
  guestCount: string
  // Package
  packageName: string
  deliverables: string
  turnaround: string
  totalAmount: string
  depositPct: string
  balanceDueDays: string
  // Extras
  secondShooter: boolean
  videography: boolean
  album: boolean
  travelIncluded: boolean
  modelRelease: boolean
  commercialRights: boolean
  // Dates
  contractDate: string
  // Notes
  specialRequirements: string
}

// ─── Smart description parser ─────────────────────────────────────────────────
function parseDescription(desc: string): Partial<FormData> {
  const d = desc.toLowerCase()
  const result: Partial<FormData> = {}

  // Project type
  if (d.includes('wedding') || d.includes('bride') || d.includes('groom') || d.includes('nuptial'))
    result.projectType = 'Wedding'
  else if (d.includes('newborn') || d.includes('baby') || d.includes('maternity'))
    result.projectType = 'Newborn'
  else if (d.includes('commercial') || d.includes('brand') || d.includes('product') || d.includes('advertising'))
    result.projectType = 'Commercial'
  else if (d.includes('portrait') || d.includes('headshot') || d.includes('family') || d.includes('graduation'))
    result.projectType = 'Portrait'
  else if (d.includes('event') || d.includes('birthday') || d.includes('party') || d.includes('conference') || d.includes('corporate') || d.includes('gala'))
    result.projectType = 'Event'

  // Duration
  if (d.includes('full day') || d.includes('full-day') || d.includes('8 hour') || d.includes('10 hour'))
    result.duration = 'Full Day (8–10 hours)'
  else if (d.includes('half day') || d.includes('half-day') || d.includes('5 hour') || d.includes('6 hour'))
    result.duration = 'Half Day (5–6 hours)'
  else if (d.includes('2 hour') || d.includes('two hour'))
    result.duration = '2 hours'
  else if (d.includes('3 hour') || d.includes('three hour'))
    result.duration = '3 hours'
  else if (d.includes('4 hour') || d.includes('four hour'))
    result.duration = '4 hours'

  // Guests
  const guestMatch = desc.match(/(\d+)\s*(guest|people|person|attendee)/i)
  if (guestMatch) result.guestCount = guestMatch[1]

  // Extras
  result.secondShooter = d.includes('second shooter') || d.includes('second photographer')
  result.videography = d.includes('video') || d.includes('film') || d.includes('cinemat')
  result.album = d.includes('album') || d.includes('photobook')
  result.commercialRights = d.includes('commercial') || d.includes('advertis') || d.includes('brand')

  // Date — simple patterns
  const dateMatch = desc.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/)
  if (dateMatch) {
    const y = dateMatch[3].length === 2 ? `20${dateMatch[3]}` : dateMatch[3]
    result.eventDate = `${y}-${dateMatch[2].padStart(2, '0')}-${dateMatch[1].padStart(2, '0')}`
  }

  // Named months
  const months: Record<string, string> = {
    january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
    july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
    jan: '01', feb: '02', mar: '03', apr: '04', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  }
  for (const [month, num] of Object.entries(months)) {
    const re = new RegExp(`(\\d{1,2})(?:st|nd|rd|th)?\\s+${month}|${month}\\s+(\\d{1,2})`, 'i')
    const m = desc.match(re)
    if (m) {
      const day = (m[1] || m[2]).padStart(2, '0')
      const yearMatch = desc.match(/20\d{2}/)
      const year = yearMatch ? yearMatch[0] : new Date().getFullYear().toString()
      result.eventDate = `${year}-${num}-${day}`
      break
    }
  }

  return result
}

// ─── Deliverables & turnaround by project type ────────────────────────────────
const TYPE_DEFAULTS: Record<ProjectType, { deliverables: string; turnaround: string; depositPct: string; balanceDueDays: string; packageName: string }> = {
  Wedding: {
    packageName: 'Wedding Photography Coverage',
    deliverables: 'Minimum 400 fully edited high-resolution digital images delivered via private online gallery. One complimentary 8×10 print. Raw files not included.',
    turnaround: '6–8 weeks from the event date',
    depositPct: '30',
    balanceDueDays: '30',
  },
  Event: {
    packageName: 'Event Photography Coverage',
    deliverables: 'Minimum 200 fully edited high-resolution digital images delivered via private online gallery. Raw files not included.',
    turnaround: '2–3 weeks from the event date',
    depositPct: '30',
    balanceDueDays: '14',
  },
  Portrait: {
    packageName: 'Portrait Photography Session',
    deliverables: '30–50 fully edited high-resolution digital images delivered via private online gallery. Client may select final images from a proof gallery.',
    turnaround: '1–2 weeks from the session date',
    depositPct: '30',
    balanceDueDays: '7',
  },
  Commercial: {
    packageName: 'Commercial Photography Services',
    deliverables: 'Agreed number of fully edited high-resolution digital images, licensed for commercial use as specified in Section 8. RAW files available at additional cost.',
    turnaround: '1–2 weeks from the session date',
    depositPct: '50',
    balanceDueDays: '7',
  },
  Newborn: {
    packageName: 'Newborn Photography Session',
    deliverables: '25–40 fully edited high-resolution digital images delivered via private online gallery. Session includes up to 3 setups/props.',
    turnaround: '2 weeks from the session date',
    depositPct: '30',
    balanceDueDays: '7',
  },
  Other: {
    packageName: 'Photography Services',
    deliverables: 'Fully edited high-resolution digital images delivered via private online gallery.',
    turnaround: '2–3 weeks from the session date',
    depositPct: '30',
    balanceDueDays: '14',
  },
}

// ─── Contract clauses per type ────────────────────────────────────────────────
function buildClauses(form: FormData): string[] {
  const type = form.projectType
  const clauses: string[] = []

  if (type === 'Wedding') {
    clauses.push('The Photographer will arrive at the agreed time and remain for the contracted duration. Overtime beyond the contracted hours will be charged at £150 per hour, subject to the Photographer\'s availability.')
    clauses.push('The Photographer will make every effort to capture all key moments. However, the Client acknowledges that certain moments (e.g., first kiss, bouquet toss) are fleeting and the Photographer cannot guarantee capture of every moment.')
    clauses.push('In the event the Photographer is unable to perform due to illness, injury, or emergency, every effort will be made to arrange an equally qualified substitute photographer. If no substitute is available, liability is limited to a full refund of all payments made.')
  }

  if (type === 'Event') {
    clauses.push('The Photographer reserves the right to use images captured at the event for portfolio and marketing purposes unless otherwise agreed in writing.')
    clauses.push('In venues with restricted photography policies, it is the Client\'s responsibility to obtain necessary permissions. The Photographer will comply with venue restrictions.')
  }

  if (type === 'Portrait') {
    clauses.push('The Client may select their preferred images from a private proof gallery within 14 days of receipt. Images not selected within this period will be archived and the standard selection will be delivered.')
    clauses.push('Re-shoot requests due to client dissatisfaction with posing or styling choices (rather than technical error) may be accommodated at the Photographer\'s discretion at an additional fee.')
  }

  if (type === 'Commercial') {
    clauses.push('All images are licensed for the agreed commercial use only. Any use beyond the scope of this Agreement requires a separate licensing agreement and additional fee.')
    clauses.push('The Photographer retains copyright in all images. The Client receives a limited licence to use images as specified. Exclusivity, if agreed, will be stated in a separate addendum.')
    clauses.push('The Client warrants that all persons, locations, and intellectual property featured in the photography have the necessary releases and permissions for commercial use.')
  }

  if (type === 'Newborn') {
    clauses.push('Newborn sessions are conducted with the safety of the infant as the absolute priority. All posing is performed by the Photographer with appropriate care and handling techniques.')
    clauses.push('Session timing is flexible to accommodate feeding and settling. The scheduled duration is an estimate; the actual session may be shorter or longer based on the infant\'s needs.')
  }

  if (form.secondShooter)
    clauses.push('A second photographer will be present to capture additional angles and moments. All images from the second photographer are covered under this Agreement.')

  if (form.videography)
    clauses.push('Videography services are included as agreed. The video deliverables, format, and turnaround time are as specified in the package details above.')

  if (form.travelIncluded)
    clauses.push('Travel to the agreed location is included within this Agreement. Any additional travel beyond the agreed location will be charged separately.')
  else
    clauses.push('Travel to locations beyond 30 miles of Birmingham, West Midlands may incur additional travel fees as quoted separately.')

  if (form.commercialRights)
    clauses.push('Commercial usage rights are granted to the Client as part of this Agreement for the purposes described. The Photographer retains the right to use images in portfolio and professional materials.')
  else
    clauses.push('Images are licensed for personal use only. Commercial or editorial use of any images requires prior written consent from the Photographer and may incur additional licensing fees.')

  if (form.modelRelease)
    clauses.push('The Client grants the Photographer permission to use images of all subjects for portfolio, website, social media, and marketing purposes unless a written opt-out is provided at the time of signing.')

  return clauses
}

// ─── Signature canvas component ───────────────────────────────────────────────
function SignatureCanvas({ label, onSign }: { label: string; onSign: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [signed, setSigned] = useState(false)

  const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const src = 'touches' in e ? e.touches[0] : e
    return { x: src.clientX - rect.left, y: src.clientY - rect.top }
  }

  const start = useCallback((e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    e.preventDefault()
    drawing.current = true
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }, [])

  const move = useCallback((e: MouseEvent | TouchEvent) => {
    if (!drawing.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    e.preventDefault()
    const ctx = canvas.getContext('2d')!
    ctx.strokeStyle = '#111'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    const pos = getPos(e, canvas)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    setSigned(true)
  }, [])

  const end = useCallback(() => {
    if (!drawing.current) return
    drawing.current = false
    const canvas = canvasRef.current
    if (!canvas || !signed) return
    onSign(canvas.toDataURL())
  }, [onSign, signed])

  const clear = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height)
    setSigned(false)
    onSign('')
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.addEventListener('mousedown', start)
    canvas.addEventListener('mousemove', move)
    canvas.addEventListener('mouseup', end)
    canvas.addEventListener('touchstart', start, { passive: false })
    canvas.addEventListener('touchmove', move, { passive: false })
    canvas.addEventListener('touchend', end)
    return () => {
      canvas.removeEventListener('mousedown', start)
      canvas.removeEventListener('mousemove', move)
      canvas.removeEventListener('mouseup', end)
      canvas.removeEventListener('touchstart', start)
      canvas.removeEventListener('touchmove', move)
      canvas.removeEventListener('touchend', end)
    }
  }, [start, move, end])

  return (
    <div>
      <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">{label}</p>
      <div className="border border-zinc-700 relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={100}
          className="w-full h-24 cursor-crosshair bg-zinc-900 block"
        />
        <div className="absolute bottom-1 left-3 text-zinc-700 text-[10px] pointer-events-none select-none">
          Sign here
        </div>
      </div>
      <div className="flex items-center justify-between mt-1">
        <p className="text-zinc-700 text-[10px]">{signed ? '✓ Signed' : 'Draw your signature above'}</p>
        <button onClick={clear} className="text-zinc-700 hover:text-zinc-400 text-[10px] uppercase tracking-widest transition-colors">Clear</button>
      </div>
    </div>
  )
}

// ─── Contract preview (printable) ─────────────────────────────────────────────
const G = '#B8962E'        // brand gold
const G_LIGHT = '#F9F3E3'  // light gold tint
const G_MID = '#E8D9A8'    // mid gold for dividers
const DARK = '#1A1814'     // near-black warm

function SectionHeading({ n, title }: { n: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', marginTop: '4px' }}>
      <div style={{
        width: '22px', height: '22px', borderRadius: '50%',
        background: DARK, color: G, fontSize: '10px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, flexShrink: 0, letterSpacing: 0,
      }}>{n}</div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700, color: DARK, margin: 0 }}>{title}</p>
        <div style={{ height: '1px', background: `linear-gradient(to right, ${G}, ${G_MID}, transparent)`, marginTop: '3px' }} />
      </div>
    </div>
  )
}

function ContractDocument({
  form, ref_, totalAmt, depositAmt, balance, clauses, clientSig, photographerSig,
}: {
  form: FormData; ref_: string; totalAmt: number; depositAmt: number; balance: number
  clauses: string[]; clientSig: string; photographerSig: string
}) {
  const fmt = (d: string) => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '_______________'
  const balanceDue = form.eventDate
    ? fmt(new Date(new Date(form.eventDate).getTime() - parseInt(form.balanceDueDays || '14') * 86400000).toISOString().split('T')[0])
    : `${form.balanceDueDays || '14'} days before the event`

  const bodyText: React.CSSProperties = { fontSize: '11px', color: '#2C2C2C', lineHeight: '1.7', margin: 0 }
  const labelText: React.CSSProperties = { fontSize: '9px', textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: '#888', fontWeight: 600 }
  const section: React.CSSProperties = { marginBottom: '20px' }

  return (
    <div style={{ background: 'white', maxWidth: '794px', margin: '0 auto', boxShadow: '0 8px 60px rgba(0,0,0,0.18)', fontFamily: 'Georgia, serif' }} id="contract-document">

      {/* ── HEADER ───────────────────────────────────────────── */}
      <div style={{ background: DARK, padding: '0' }}>
        {/* Top gold rule */}
        <div style={{ height: '4px', background: `linear-gradient(to right, ${G}, #E8C96A, ${G})` }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '28px 40px 20px' }}>
          {/* Left: logo + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'white', borderRadius: '50%', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', boxShadow: `0 0 0 2px ${G}` }}>
              <img src="/logo/logo.png" alt="Visual by Sherif" style={{ width: '56px', height: '56px', objectFit: 'contain' }} />
            </div>
            <div>
              <p style={{ color: 'white', fontSize: '17px', fontWeight: 300, letterSpacing: '0.3em', textTransform: 'uppercase', margin: 0, fontFamily: 'Georgia, serif' }}>Visual by Sherif</p>
              <p style={{ color: G, fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '3px 0 2px', fontFamily: 'sans-serif' }}>Photography &amp; Cinematography</p>
              <p style={{ color: '#888', fontSize: '9px', margin: 0, fontFamily: 'sans-serif' }}>Birmingham, West Midlands &nbsp;·&nbsp; Virtualsbysherif@gmail.com</p>
            </div>
          </div>

          {/* Right: document title */}
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: G, fontSize: '9px', letterSpacing: '0.25em', textTransform: 'uppercase', margin: '0 0 4px', fontFamily: 'sans-serif' }}>Legally Binding Document</p>
            <p style={{ color: 'white', fontSize: '20px', fontWeight: 300, letterSpacing: '0.18em', textTransform: 'uppercase', margin: 0, lineHeight: 1.15 }}>Photography</p>
            <p style={{ color: 'white', fontSize: '20px', fontWeight: 300, letterSpacing: '0.18em', textTransform: 'uppercase', margin: 0, lineHeight: 1.15 }}>Services Agreement</p>
            <div style={{ height: '1px', background: G, margin: '8px 0 6px', opacity: 0.5 }} />
            <p style={{ color: G, fontSize: '10px', fontFamily: 'monospace', margin: '0 0 2px' }}>{ref_}</p>
            <p style={{ color: '#888', fontSize: '9px', fontFamily: 'sans-serif', margin: 0 }}>Dated: {fmt(form.contractDate)}</p>
          </div>
        </div>

        {/* Bottom gold rule */}
        <div style={{ height: '2px', background: `linear-gradient(to right, transparent, ${G}, transparent)` }} />
      </div>

      {/* ── META BAR ─────────────────────────────────────────── */}
      <div style={{ background: G_LIGHT, borderBottom: `1px solid ${G_MID}`, padding: '10px 40px', display: 'flex', gap: '36px', alignItems: 'center' }}>
        {[
          ['Contract Type', form.projectType + ' Photography'],
          ['Effective Date', fmt(form.contractDate)],
          ['Reference', ref_],
        ].map(([k, v]) => (
          <div key={k}>
            <p style={{ ...labelText, margin: '0 0 1px' }}>{k}</p>
            <p style={{ fontSize: '11px', fontWeight: 600, color: DARK, margin: 0, fontFamily: 'sans-serif' }}>{v}</p>
          </div>
        ))}
      </div>

      {/* ── BODY ─────────────────────────────────────────────── */}
      <div style={{ padding: '32px 40px 0' }}>

        {/* Opening */}
        <p style={{ ...bodyText, fontStyle: 'italic', color: '#555', textAlign: 'center', marginBottom: '24px', fontSize: '11.5px' }}>
          This Photography Services Agreement ("<strong>Agreement</strong>") is entered into as of <strong>{fmt(form.contractDate)}</strong>,
          by and between the parties identified below, and constitutes a legally binding contract.
        </p>

        {/* ── Parties ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          {/* Photographer */}
          <div style={{ border: `1px solid ${G_MID}`, borderTop: `3px solid ${G}`, padding: '14px 16px', background: G_LIGHT }}>
            <p style={{ ...labelText, color: G, margin: '0 0 8px' }}>Photographer</p>
            <p style={{ fontSize: '13px', fontWeight: 700, color: DARK, margin: '0 0 4px' }}>Visual by Sherif</p>
            <p style={{ ...bodyText, fontSize: '10px', color: '#555' }}>Photography &amp; Cinematography</p>
            <p style={{ ...bodyText, fontSize: '10px', color: '#555' }}>Birmingham, West Midlands</p>
            <p style={{ ...bodyText, fontSize: '10px', color: '#555' }}>Virtualsbysherif@gmail.com</p>
          </div>
          {/* Client */}
          <div style={{ border: `1px solid #DDD`, borderTop: `3px solid #AAA`, padding: '14px 16px', background: '#FAFAFA' }}>
            <p style={{ ...labelText, margin: '0 0 8px' }}>Client</p>
            <p style={{ fontSize: '13px', fontWeight: 700, color: DARK, margin: '0 0 4px' }}>{form.clientName || '_______________'}</p>
            {form.clientEmail && <p style={{ ...bodyText, fontSize: '10px', color: '#555' }}>{form.clientEmail}</p>}
            {form.clientPhone && <p style={{ ...bodyText, fontSize: '10px', color: '#555' }}>{form.clientPhone}</p>}
            {form.clientAddress && <p style={{ ...bodyText, fontSize: '10px', color: '#555', whiteSpace: 'pre-line' }}>{form.clientAddress}</p>}
          </div>
        </div>

        {/* 1. Services */}
        <div style={section}>
          <SectionHeading n="1" title="Services" />
          <p style={bodyText}>The Photographer agrees to provide <strong>{form.packageName || form.projectType + ' Photography'}</strong> services for the Client as detailed in this Agreement.</p>
          {form.projectDescription && (
            <div style={{ background: G_LIGHT, border: `1px solid ${G_MID}`, borderLeft: `3px solid ${G}`, padding: '10px 14px', marginTop: '10px' }}>
              <p style={{ ...labelText, margin: '0 0 4px' }}>Project Description (as provided by Client)</p>
              <p style={{ ...bodyText, fontStyle: 'italic', color: '#444' }}>"{form.projectDescription}"</p>
            </div>
          )}
        </div>

        {/* 2. Event Details */}
        <div style={section}>
          <SectionHeading n="2" title="Event Details" />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <tbody>
              {([
                ['Type of Service', form.projectType],
                ['Event / Session Date', fmt(form.eventDate)],
                form.eventTime ? ['Start Time', form.eventTime] : null,
                ['Venue / Location', form.eventLocation || '_______________'],
                ['Duration', form.duration || '_______________'],
                form.guestCount ? ['Approximate Guests', form.guestCount] : null,
              ] as [string,string][]).filter(Boolean).map(([k, v], i) => (
                <tr key={k} style={{ background: i % 2 === 0 ? '#FAFAFA' : 'white' }}>
                  <td style={{ padding: '7px 10px', color: '#777', width: '200px', borderBottom: '1px solid #EEE', fontSize: '10px', fontFamily: 'sans-serif' }}>{k}</td>
                  <td style={{ padding: '7px 10px', fontWeight: 600, color: DARK, borderBottom: '1px solid #EEE', fontFamily: 'sans-serif' }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 3. Deliverables */}
        <div style={section}>
          <SectionHeading n="3" title="Deliverables & Turnaround" />
          <p style={bodyText}>{form.deliverables}</p>
          <p style={{ ...bodyText, marginTop: '8px' }}><span style={{ color: '#777', fontFamily: 'sans-serif', fontSize: '10px' }}>Delivery Timeline:</span>&nbsp; {form.turnaround}.</p>
          {form.specialRequirements && (
            <p style={{ ...bodyText, marginTop: '8px' }}><span style={{ color: '#777', fontFamily: 'sans-serif', fontSize: '10px' }}>Special Requirements:</span>&nbsp; {form.specialRequirements}</p>
          )}
        </div>

        {/* 4. Fees */}
        <div style={section}>
          <SectionHeading n="4" title="Fees & Payment Schedule" />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '10px' }}>
            <thead>
              <tr style={{ background: DARK }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: G, fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, fontFamily: 'sans-serif' }}>Description</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', color: G, fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, fontFamily: 'sans-serif', width: '120px' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #EEE' }}>
                <td style={{ padding: '9px 12px', color: '#444', fontFamily: 'sans-serif' }}>{form.packageName || 'Photography Services'}</td>
                <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 600, color: DARK, fontFamily: 'sans-serif' }}>£{totalAmt.toFixed(2)}</td>
              </tr>
              <tr style={{ background: G_LIGHT, borderBottom: `1px solid ${G_MID}`, borderTop: `1px solid ${G_MID}` }}>
                <td style={{ padding: '9px 12px', fontFamily: 'sans-serif' }}>
                  <span style={{ color: G, fontWeight: 700 }}>Booking Deposit ({form.depositPct}%)</span>
                  <span style={{ color: '#777', fontSize: '10px' }}> — Due upon signing</span>
                </td>
                <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 700, color: G, fontSize: '14px', fontFamily: 'sans-serif' }}>£{depositAmt.toFixed(2)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #EEE' }}>
                <td style={{ padding: '9px 12px', color: '#444', fontFamily: 'sans-serif' }}>
                  Remaining Balance — Due by <span style={{ fontWeight: 600 }}>{balanceDue}</span>
                </td>
                <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 600, color: DARK, fontFamily: 'sans-serif' }}>£{balance.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          <p style={{ ...bodyText, fontSize: '10px', color: '#888', fontFamily: 'sans-serif' }}>Payment accepted by bank transfer. Details provided separately. A 5% late payment charge applies to invoices unpaid after 7 days of the due date.</p>
        </div>

        {/* 5. Cancellation */}
        <div style={section}>
          <SectionHeading n="5" title="Cancellation & Rescheduling" />
          <ul style={{ margin: 0, paddingLeft: '16px' }}>
            {[
              ['>60 days before event', 'Deposit forfeited; no further charges apply.'],
              ['30–60 days before event', '50% of the total fee becomes due.'],
              ['<30 days before event', '100% of the total fee becomes due.'],
              ['Rescheduling', 'Subject to availability. One complimentary reschedule with >30 days notice.'],
              ['Photographer cancels', 'Full refund of all amounts paid to the Client.'],
            ].map(([k, v]) => (
              <li key={k} style={{ ...bodyText, marginBottom: '5px', fontFamily: 'sans-serif', fontSize: '10.5px' }}>
                <span style={{ fontWeight: 700, color: DARK }}>{k}:</span> {v}
              </li>
            ))}
          </ul>
        </div>

        {/* 6. Copyright */}
        <div style={section}>
          <SectionHeading n="6" title="Copyright & Intellectual Property" />
          <p style={bodyText}>The Photographer retains full copyright in all images created under this Agreement. The Client is granted a <strong>{form.commercialRights ? 'commercial' : 'personal, non-commercial'}</strong> licence to use, print, and share the delivered images. The Photographer reserves the right to use any image for portfolio, exhibition, website, and social media purposes unless a written opt-out is provided.</p>
        </div>

        {/* 7. Liability */}
        <div style={section}>
          <SectionHeading n="7" title="Limitation of Liability" />
          <p style={bodyText}>The Photographer's total liability shall not exceed the total fees paid by the Client. The Photographer is not liable for indirect, consequential, or incidental losses. Professional backup equipment will be maintained but performance cannot be guaranteed in all circumstances.</p>
        </div>

        {/* 8. Force Majeure */}
        <div style={section}>
          <SectionHeading n="8" title="Force Majeure" />
          <p style={bodyText}>Neither party shall be in breach if performance is prevented by circumstances beyond their reasonable control, including acts of God, severe weather, government restrictions, or public health emergencies. Both parties will make reasonable efforts to reschedule.</p>
        </div>

        {/* 9. Additional Terms */}
        {clauses.length > 0 && (
          <div style={section}>
            <SectionHeading n="9" title="Additional Terms" />
            <ul style={{ margin: 0, paddingLeft: '16px' }}>
              {clauses.map((c, i) => (
                <li key={i} style={{ ...bodyText, marginBottom: '6px', fontFamily: 'sans-serif', fontSize: '10.5px' }}>{c}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 10. Governing Law */}
        <div style={{ marginBottom: '28px' }}>
          <SectionHeading n={clauses.length > 0 ? '10' : '9'} title="Governing Law" />
          <p style={bodyText}>This Agreement is governed by the laws of England and Wales. Any dispute shall be resolved in the courts of England and Wales. Both parties agree to attempt resolution through good-faith negotiation before initiating legal proceedings.</p>
        </div>
      </div>

      {/* ── SIGNATURES ───────────────────────────────────────── */}
      <div style={{ margin: '0 40px 0', borderTop: `2px solid ${G}`, position: 'relative', overflow: 'hidden' }}>
        {/* Watermark */}
        <p style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%) rotate(-30deg)',
          fontSize: '52px', fontWeight: 700, color: 'rgba(184,150,46,0.05)',
          textTransform: 'uppercase', letterSpacing: '0.2em', whiteSpace: 'nowrap',
          pointerEvents: 'none', userSelect: 'none',
        }}>Visual by Sherif</p>

        <div style={{ padding: '24px 0 32px' }}>
          <p style={{ ...labelText, textAlign: 'center', fontSize: '11px', color: G, marginBottom: '6px' }}>Execution of Agreement</p>
          <p style={{ ...bodyText, textAlign: 'center', fontSize: '10.5px', color: '#777', marginBottom: '24px', fontFamily: 'sans-serif' }}>
            By signing below, both parties confirm they have read, understood, and agree to all terms of this Agreement.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
            {/* Photographer */}
            <div style={{ border: `1px solid ${G_MID}`, padding: '16px' }}>
              <p style={{ ...labelText, color: G, marginBottom: '10px' }}>Photographer Signature</p>
              <div style={{ height: '64px', borderBottom: `1px dashed #BBB`, marginBottom: '8px', display: 'flex', alignItems: 'flex-end', background: G_LIGHT }}>
                {photographerSig && <img src={photographerSig} alt="sig" style={{ height: '56px', objectFit: 'contain' }} />}
              </div>
              <p style={{ fontWeight: 700, fontSize: '12px', color: DARK, margin: '0 0 2px' }}>Visual by Sherif</p>
              <p style={{ fontSize: '10px', color: '#777', margin: '0 0 2px', fontFamily: 'sans-serif' }}>Birmingham, West Midlands</p>
              <p style={{ fontSize: '10px', color: '#999', margin: 0, fontFamily: 'sans-serif' }}>Date: {fmt(form.contractDate)}</p>
            </div>

            {/* Client */}
            <div style={{ border: '1px solid #DDD', padding: '16px' }}>
              <p style={{ ...labelText, marginBottom: '10px' }}>Client Signature</p>
              <div style={{ height: '64px', borderBottom: '1px dashed #BBB', marginBottom: '8px', display: 'flex', alignItems: 'flex-end', background: '#FAFAFA' }}>
                {clientSig && <img src={clientSig} alt="sig" style={{ height: '56px', objectFit: 'contain' }} />}
              </div>
              <p style={{ fontWeight: 700, fontSize: '12px', color: DARK, margin: '0 0 2px' }}>{form.clientName || '_______________'}</p>
              {form.clientEmail && <p style={{ fontSize: '10px', color: '#777', margin: '0 0 2px', fontFamily: 'sans-serif' }}>{form.clientEmail}</p>}
              <p style={{ fontSize: '10px', color: '#999', margin: 0, fontFamily: 'sans-serif' }}>Date: {fmt(form.contractDate)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <div style={{ background: DARK }}>
        <div style={{ height: '2px', background: `linear-gradient(to right, transparent, ${G}, transparent)` }} />
        <div style={{ padding: '14px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'white', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/logo/logo.png" alt="" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
            </div>
            <p style={{ color: G, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0, fontFamily: 'sans-serif' }}>Visual by Sherif</p>
          </div>
          <p style={{ color: '#666', fontSize: '9px', margin: 0, fontFamily: 'sans-serif' }}>
            Virtualsbysherif@gmail.com &nbsp;·&nbsp; Birmingham, West Midlands &nbsp;·&nbsp; Ref: {ref_}
          </p>
        </div>
        <div style={{ height: '3px', background: `linear-gradient(to right, ${G}, #E8C96A, ${G})` }} />
      </div>

    </div>
  )
}

// ─── Generate ref ─────────────────────────────────────────────────────────────
function generateRef() {
  const d = new Date()
  return `VBS-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ContractPage() {
  const [ref_] = useState(generateRef)
  const [preview, setPreview] = useState(false)
  const [clientSig, setClientSig] = useState('')
  const [photographerSig, setPhotographerSig] = useState('')

  const [form, setForm] = useState<FormData>({
    clientName: '', clientEmail: '', clientPhone: '', clientAddress: '',
    projectDescription: '',
    projectType: 'Wedding',
    eventDate: '', eventTime: '', eventLocation: '', duration: '',
    guestCount: '',
    packageName: TYPE_DEFAULTS.Wedding.packageName,
    deliverables: TYPE_DEFAULTS.Wedding.deliverables,
    turnaround: TYPE_DEFAULTS.Wedding.turnaround,
    totalAmount: '', depositPct: TYPE_DEFAULTS.Wedding.depositPct,
    balanceDueDays: TYPE_DEFAULTS.Wedding.balanceDueDays,
    secondShooter: false, videography: false, album: false,
    travelIncluded: false, modelRelease: true, commercialRights: false,
    contractDate: new Date().toISOString().split('T')[0],
    specialRequirements: '',
  })

  const set = (k: keyof FormData, v: any) => setForm(p => ({ ...p, [k]: v }))

  // When project type changes, update defaults
  const setType = (type: ProjectType) => {
    const d = TYPE_DEFAULTS[type]
    setForm(p => ({
      ...p, projectType: type,
      packageName: d.packageName,
      deliverables: d.deliverables,
      turnaround: d.turnaround,
      depositPct: d.depositPct,
      balanceDueDays: d.balanceDueDays,
    }))
  }

  // Parse description and auto-fill fields
  const handleDescriptionBlur = () => {
    if (!form.projectDescription.trim()) return
    const parsed = parseDescription(form.projectDescription)
    if (parsed.projectType && parsed.projectType !== form.projectType) {
      const d = TYPE_DEFAULTS[parsed.projectType]
      setForm(p => ({
        ...p, ...parsed,
        packageName: d.packageName,
        deliverables: d.deliverables,
        turnaround: d.turnaround,
        depositPct: d.depositPct,
        balanceDueDays: d.balanceDueDays,
      }))
    } else {
      setForm(p => ({ ...p, ...parsed }))
    }
  }

  const totalAmt = parseFloat(form.totalAmount) || 0
  const depositAmt = totalAmt * (parseFloat(form.depositPct) || 30) / 100
  const balance = totalAmt - depositAmt
  const clauses = buildClauses(form)

  const inputCls = 'w-full bg-zinc-900 border border-zinc-800 text-white px-3 py-2.5 text-sm focus:outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-700'
  const TYPES: ProjectType[] = ['Wedding', 'Event', 'Portrait', 'Commercial', 'Newborn', 'Other']

  return (
    <div className="min-h-screen pt-16 bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-zinc-600 uppercase tracking-[0.4em] text-xs mb-2">Sessions</p>
            <h1 className="text-3xl font-thin text-white">Contract Generator</h1>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setPreview(p => !p)} className="border border-zinc-700 text-zinc-400 hover:text-white px-5 py-2.5 text-xs uppercase tracking-widest transition-colors">
              {preview ? 'Edit' : 'Preview Contract'}
            </button>
            <button onClick={() => window.print()} className="bg-white text-zinc-950 px-5 py-2.5 text-xs uppercase tracking-widest hover:bg-zinc-100 transition-colors">
              Print / Download
            </button>
          </div>
        </div>

        {!preview ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">

              {/* AI Description */}
              <div className="border border-amber-500/20 bg-amber-500/5 p-6 space-y-3">
                <p className="text-amber-300 text-xs uppercase tracking-widest">AI Auto-Fill</p>
                <p className="text-zinc-400 text-xs">Describe the project and the contract will auto-populate.</p>
                <textarea
                  className={`${inputCls} border-amber-500/30 focus:border-amber-500/60`}
                  rows={3}
                  value={form.projectDescription}
                  onChange={e => set('projectDescription', e.target.value)}
                  onBlur={handleDescriptionBlur}
                  placeholder="e.g. Full day wedding photography for 150 guests on 15th June 2026 at The Grand Hotel Birmingham, including second shooter and highlight video..."
                />
                <button
                  onClick={handleDescriptionBlur}
                  className="bg-amber-500/20 border border-amber-500/30 text-amber-300 px-4 py-2 text-xs uppercase tracking-widest hover:bg-amber-500/30 transition-colors"
                >
                  Auto-Fill from Description
                </button>
              </div>

              {/* Client details */}
              <div className="border border-zinc-800 p-6 space-y-4">
                <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Client Details</p>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label-xs">Full Name *</label><input className={inputCls} value={form.clientName} onChange={e => set('clientName', e.target.value)} placeholder="Jane Smith" /></div>
                  <div><label className="label-xs">Email</label><input className={inputCls} value={form.clientEmail} onChange={e => set('clientEmail', e.target.value)} placeholder="jane@example.com" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label-xs">Phone</label><input className={inputCls} value={form.clientPhone} onChange={e => set('clientPhone', e.target.value)} placeholder="+44 7XXX XXXXXX" /></div>
                  <div><label className="label-xs">Address</label><input className={inputCls} value={form.clientAddress} onChange={e => set('clientAddress', e.target.value)} placeholder="City, Postcode" /></div>
                </div>
              </div>

              {/* Project type */}
              <div className="border border-zinc-800 p-6 space-y-4">
                <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Project Type</p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {TYPES.map(t => (
                    <button key={t} onClick={() => setType(t)}
                      className={`p-3 text-xs uppercase tracking-widest border transition-colors ${form.projectType === t ? 'border-white bg-zinc-900 text-white' : 'border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Event details */}
              <div className="border border-zinc-800 p-6 space-y-4">
                <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Event Details</p>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label-xs">Date</label><input type="date" className={inputCls} value={form.eventDate} onChange={e => set('eventDate', e.target.value)} /></div>
                  <div><label className="label-xs">Start Time</label><input type="time" className={inputCls} value={form.eventTime} onChange={e => set('eventTime', e.target.value)} /></div>
                </div>
                <div><label className="label-xs">Location / Venue</label><input className={inputCls} value={form.eventLocation} onChange={e => set('eventLocation', e.target.value)} placeholder="The Grand Hotel, Birmingham" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label-xs">Duration</label><input className={inputCls} value={form.duration} onChange={e => set('duration', e.target.value)} placeholder="8 hours" /></div>
                  <div><label className="label-xs">Guests / Attendees</label><input type="number" className={inputCls} value={form.guestCount} onChange={e => set('guestCount', e.target.value)} placeholder="150" /></div>
                </div>
              </div>

              {/* Package & deliverables */}
              <div className="border border-zinc-800 p-6 space-y-4">
                <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Package & Deliverables</p>
                <div><label className="label-xs">Package Name</label><input className={inputCls} value={form.packageName} onChange={e => set('packageName', e.target.value)} /></div>
                <div><label className="label-xs">Deliverables</label><textarea className={inputCls} rows={3} value={form.deliverables} onChange={e => set('deliverables', e.target.value)} /></div>
                <div><label className="label-xs">Turnaround Time</label><input className={inputCls} value={form.turnaround} onChange={e => set('turnaround', e.target.value)} /></div>
                <div><label className="label-xs">Special Requirements</label><textarea className={inputCls} rows={2} value={form.specialRequirements} onChange={e => set('specialRequirements', e.target.value)} placeholder="Shot list, specific requests..." /></div>
              </div>

              {/* Add-ons */}
              <div className="border border-zinc-800 p-6 space-y-3">
                <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Inclusions & Rights</p>
                {([
                  ['secondShooter', 'Second Shooter'],
                  ['videography', 'Videography'],
                  ['album', 'Luxury Album'],
                  ['travelIncluded', 'Travel Included'],
                  ['modelRelease', 'Portfolio Release Granted'],
                  ['commercialRights', 'Commercial Usage Rights'],
                ] as [keyof FormData, string][]).map(([k, label]) => (
                  <label key={k} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={!!form[k]} onChange={e => set(k, e.target.checked)} className="w-4 h-4 accent-white" />
                    <span className="text-zinc-400 text-sm">{label}</span>
                  </label>
                ))}
              </div>

              {/* Signatures */}
              <div className="border border-zinc-800 p-6 space-y-5">
                <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Electronic Signatures</p>
                <SignatureCanvas label="Photographer Signature" onSign={setPhotographerSig} />
                <SignatureCanvas label="Client Signature" onSign={setClientSig} />
              </div>
            </div>

            {/* Right: summary */}
            <div className="space-y-4">
              <div className="border border-zinc-800 p-6 sticky top-20 space-y-3">
                <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Contract Summary</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-zinc-500">Ref</span><span className="text-white text-xs font-mono">{ref_}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Type</span><span className="text-white">{form.projectType}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Client</span><span className="text-white truncate max-w-[120px]">{form.clientName || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Date</span><span className="text-white">{form.eventDate || '—'}</span></div>
                  <div className="border-t border-zinc-800 pt-2 mt-2" />
                  <div>
                    <label className="label-xs">Total Amount £</label>
                    <input type="number" className={inputCls} value={form.totalAmount} onChange={e => set('totalAmount', e.target.value)} placeholder="2000" />
                  </div>
                  <div>
                    <label className="label-xs">Deposit %</label>
                    <input type="number" className={inputCls} value={form.depositPct} onChange={e => set('depositPct', e.target.value)} min={1} max={100} />
                  </div>
                  <div>
                    <label className="label-xs">Contract Date</label>
                    <input type="date" className={inputCls} value={form.contractDate} onChange={e => set('contractDate', e.target.value)} />
                  </div>
                  <div className="border-t border-zinc-800 pt-2" />
                  <div className="flex justify-between"><span className="text-zinc-500">Total</span><span className="text-white">£{totalAmt.toFixed(2)}</span></div>
                  <div className="flex justify-between text-amber-400"><span>Deposit</span><span>£{depositAmt.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Balance</span><span className="text-zinc-400">£{balance.toFixed(2)}</span></div>
                </div>
                <div className="border-t border-zinc-800 pt-3 space-y-1">
                  <div className="flex items-center gap-2 text-xs"><span className={`w-2 h-2 rounded-full ${photographerSig ? 'bg-green-500' : 'bg-zinc-700'}`} /><span className="text-zinc-500">Photographer {photographerSig ? 'signed' : 'not signed'}</span></div>
                  <div className="flex items-center gap-2 text-xs"><span className={`w-2 h-2 rounded-full ${clientSig ? 'bg-green-500' : 'bg-zinc-700'}`} /><span className="text-zinc-500">Client {clientSig ? 'signed' : 'not signed'}</span></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <ContractDocument
            form={form} ref_={ref_} totalAmt={totalAmt} depositAmt={depositAmt}
            balance={balance} clauses={clauses} clientSig={clientSig} photographerSig={photographerSig}
          />
        )}
      </div>
      <style jsx global>{`
        .label-xs{display:block;color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px}
        @media print{
          nav,button,.no-print{display:none!important}
          body{background:#F5F0E8!important;margin:0;padding:0}
          #contract-document{box-shadow:none!important;max-width:100%!important}
          @page{margin:0;size:A4}
        }
      `}</style>
    </div>
  )
}
