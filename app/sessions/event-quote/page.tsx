'use client'

import { useState } from 'react'

function generateRef() {
  return `EVT-${new Date().getFullYear()}-${Math.floor(1000+Math.random()*9000)}`
}

const PACKAGES = [
  { label: 'Half Day (5–6hrs)', base: 1200 },
  { label: 'Full Day (8–10hrs)', base: 2000 },
  { label: 'Multi-Day Event', base: 3500 },
  { label: 'Corporate Event', base: 1800 },
  { label: 'Custom Package', base: 0 },
]

const ADDONS = [
  { id: 'secondShooter', label: 'Second Shooter', price: 400 },
  { id: 'drone', label: 'Drone Footage', price: 300 },
  { id: 'sameDay', label: 'Same-Day Edit', price: 500 },
  { id: 'album', label: 'Luxury Album', price: 350 },
  { id: 'prints', label: 'Fine Art Print Set', price: 250 },
  { id: 'rush', label: 'Rush Delivery (5 days)', price: 200 },
  { id: 'videography', label: 'Videography Add-on', price: 800 },
]

export default function EventQuotePage() {
  const [ref] = useState(generateRef)
  const [form, setForm] = useState({
    clientName: '', clientEmail: '', eventName: '',
    eventDate: '', eventType: '', location: '',
    guestCount: '', packageIdx: '0', customBase: '',
    addons: [] as string[], travelFee: '', notes: '',
    validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
  })
  const [preview, setPreview] = useState(false)
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const pkg = PACKAGES[parseInt(form.packageIdx)]
  const basePrice = form.packageIdx === '4' ? (parseFloat(form.customBase) || 0) : pkg.base
  const addonTotal = ADDONS.filter(a => form.addons.includes(a.id)).reduce((s, a) => s + a.price, 0)
  const travelFee = parseFloat(form.travelFee) || 0
  const subtotal = basePrice + addonTotal + travelFee
  const vat = subtotal * 0.2
  const total = subtotal + vat

  const toggleAddon = (id: string) => set('addons', form.addons.includes(id) ? form.addons.filter(a => a !== id) : [...form.addons, id])

  const inputCls = 'w-full bg-zinc-900 border border-zinc-800 text-white px-3 py-2.5 text-sm focus:outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-700'

  return (
    <div className="min-h-screen pt-16 bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-zinc-600 uppercase tracking-[0.4em] text-xs mb-2">Sessions</p>
            <h1 className="text-3xl font-thin text-white">Event Quote</h1>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setPreview(p => !p)} className="border border-zinc-700 text-zinc-400 hover:text-white px-5 py-2.5 text-xs uppercase tracking-widest transition-colors">
              {preview ? 'Edit' : 'Preview'}
            </button>
            <button onClick={() => window.print()} className="bg-white text-zinc-950 px-5 py-2.5 text-xs uppercase tracking-widest hover:bg-zinc-100 transition-colors">
              Print / Download
            </button>
          </div>
        </div>

        {!preview ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="border border-zinc-800 p-6 space-y-4">
                <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Event Details</p>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label-xs">Client Name</label><input className={inputCls} value={form.clientName} onChange={e => set('clientName', e.target.value)} placeholder="Jane Smith" /></div>
                  <div><label className="label-xs">Client Email</label><input className={inputCls} value={form.clientEmail} onChange={e => set('clientEmail', e.target.value)} placeholder="jane@..." /></div>
                </div>
                <div><label className="label-xs">Event Name</label><input className={inputCls} value={form.eventName} onChange={e => set('eventName', e.target.value)} placeholder="Smith Wedding Reception" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label-xs">Event Type</label><input className={inputCls} value={form.eventType} onChange={e => set('eventType', e.target.value)} placeholder="Wedding, Corporate, Gala..." /></div>
                  <div><label className="label-xs">Guest Count</label><input type="number" className={inputCls} value={form.guestCount} onChange={e => set('guestCount', e.target.value)} placeholder="150" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label-xs">Event Date</label><input type="date" className={inputCls} value={form.eventDate} onChange={e => set('eventDate', e.target.value)} /></div>
                  <div><label className="label-xs">Location</label><input className={inputCls} value={form.location} onChange={e => set('location', e.target.value)} placeholder="Venue, City" /></div>
                </div>
              </div>

              <div className="border border-zinc-800 p-6 space-y-4">
                <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Package</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PACKAGES.map((p, i) => (
                    <button key={i} onClick={() => set('packageIdx', String(i))}
                      className={`p-4 text-left border transition-colors ${form.packageIdx === String(i) ? 'border-white bg-zinc-900' : 'border-zinc-800 hover:border-zinc-600'}`}>
                      <p className={`text-xs uppercase tracking-widest mb-1 ${form.packageIdx === String(i) ? 'text-white' : 'text-zinc-500'}`}>{p.label}</p>
                      {i < 4 && <p className="text-white text-lg font-light">£{p.base.toLocaleString()}</p>}
                    </button>
                  ))}
                </div>
                {form.packageIdx === '4' && (
                  <div><label className="label-xs">Custom Base Price £</label><input type="number" className={inputCls} value={form.customBase} onChange={e => set('customBase', e.target.value)} /></div>
                )}
              </div>

              <div className="border border-zinc-800 p-6">
                <p className="text-zinc-500 text-xs uppercase tracking-widest mb-4">Add-ons</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ADDONS.map(a => (
                    <button key={a.id} onClick={() => toggleAddon(a.id)}
                      className={`flex items-center justify-between p-3 border text-left transition-colors ${form.addons.includes(a.id) ? 'border-amber-500/50 bg-amber-500/5' : 'border-zinc-800 hover:border-zinc-600'}`}>
                      <span className={`text-xs uppercase tracking-widest ${form.addons.includes(a.id) ? 'text-amber-300' : 'text-zinc-400'}`}>{a.label}</span>
                      <span className={`text-sm ${form.addons.includes(a.id) ? 'text-amber-300' : 'text-zinc-600'}`}>+£{a.price}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border border-zinc-800 p-6 space-y-4">
                <div><label className="label-xs">Travel Fee £ (if applicable)</label><input type="number" className={inputCls} value={form.travelFee} onChange={e => set('travelFee', e.target.value)} placeholder="0" /></div>
                <div><label className="label-xs">Quote Valid Until</label><input type="date" className={inputCls} value={form.validUntil} onChange={e => set('validUntil', e.target.value)} /></div>
                <div><label className="label-xs">Notes</label><textarea className={inputCls} rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Special requirements, inclusions, terms..." /></div>
              </div>
            </div>

            <div className="border border-zinc-800 p-6 h-fit sticky top-20 space-y-3">
              <p className="text-zinc-500 text-xs uppercase tracking-widest mb-4">Quote Summary</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-zinc-500">{pkg.label}</span><span className="text-white">£{basePrice.toLocaleString()}</span></div>
                {ADDONS.filter(a => form.addons.includes(a.id)).map(a => (
                  <div key={a.id} className="flex justify-between"><span className="text-zinc-500">{a.label}</span><span className="text-amber-300">+£{a.price}</span></div>
                ))}
                {travelFee > 0 && <div className="flex justify-between"><span className="text-zinc-500">Travel</span><span className="text-white">£{travelFee}</span></div>}
                <div className="flex justify-between border-t border-zinc-800 pt-2"><span className="text-zinc-500">Subtotal</span><span className="text-white">£{subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">VAT (20%)</span><span className="text-white">£{vat.toFixed(0)}</span></div>
                <div className="flex justify-between border-t border-zinc-700 pt-2 text-base">
                  <span className="text-white uppercase text-xs tracking-widest">Total</span>
                  <span className="text-white text-xl">£{total.toFixed(0)}</span>
                </div>
              </div>
              <p className="text-zinc-700 text-[10px] mt-4">30% deposit (£{(total*0.3).toFixed(0)}) required to secure date.</p>
            </div>
          </div>
        ) : (
          <EventPreview ref_={ref} form={form} pkg={pkg} basePrice={basePrice} addonTotal={addonTotal} travelFee={travelFee} subtotal={subtotal} vat={vat} total={total} addons={ADDONS} />
        )}
      </div>
      <style jsx global>{`.label-xs{display:block;color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px}@media print{nav,button{display:none!important}body{background:white!important;color:black!important}}`}</style>
    </div>
  )
}

function EventPreview({ ref_, form, pkg, basePrice, addonTotal, travelFee, subtotal, vat, total, addons }: any) {
  const selectedAddons = addons.filter((a: any) => form.addons.includes(a.id))
  return (
    <div className="bg-white text-zinc-900 max-w-3xl mx-auto p-12 shadow-2xl">
      <div className="flex justify-between items-start mb-10">
        <div>
          <h2 className="text-2xl font-light tracking-widest uppercase mb-1">Visual by Sherif</h2>
          <p className="text-zinc-500 text-xs">Photography & Cinematography</p>
          <p className="text-zinc-500 text-xs">Birmingham, West Midlands</p>
          <p className="text-zinc-500 text-xs">Virtualsbysherif@gmail.com</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-thin mb-1">EVENT QUOTE</p>
          <p className="text-zinc-500 text-sm font-mono">{ref_}</p>
          <p className="text-zinc-500 text-xs mt-1">Valid until: {form.validUntil}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-10">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-400 mb-2">Prepared For</p>
          <p className="font-medium">{form.clientName || '—'}</p>
          {form.clientEmail && <p className="text-zinc-600 text-sm">{form.clientEmail}</p>}
        </div>
        <div className="text-right space-y-1 text-sm">
          {form.eventName && <p className="font-medium">{form.eventName}</p>}
          {form.eventType && <p className="text-zinc-600">{form.eventType}</p>}
          {form.eventDate && <p className="text-zinc-600">Date: {form.eventDate}</p>}
          {form.location && <p className="text-zinc-600">{form.location}</p>}
          {form.guestCount && <p className="text-zinc-600">{form.guestCount} guests</p>}
        </div>
      </div>

      <table className="w-full mb-6">
        <thead>
          <tr className="border-b-2 border-zinc-200">
            <th className="text-left py-2 text-xs uppercase tracking-widest text-zinc-400 font-normal">Item</th>
            <th className="text-right py-2 text-xs uppercase tracking-widest text-zinc-400 font-normal w-28">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-zinc-100">
            <td className="py-3 text-sm font-medium">{pkg.label}</td>
            <td className="py-3 text-sm text-right">£{basePrice.toLocaleString()}</td>
          </tr>
          {selectedAddons.map((a: any) => (
            <tr key={a.id} className="border-b border-zinc-100">
              <td className="py-3 text-sm">{a.label}</td>
              <td className="py-3 text-sm text-right">£{a.price}</td>
            </tr>
          ))}
          {travelFee > 0 && (
            <tr className="border-b border-zinc-100">
              <td className="py-3 text-sm">Travel Fee</td>
              <td className="py-3 text-sm text-right">£{travelFee}</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="flex justify-end mb-8">
        <div className="w-64 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-zinc-500">Subtotal</span><span>£{subtotal.toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">VAT (20%)</span><span>£{vat.toFixed(0)}</span></div>
          <div className="flex justify-between text-lg font-medium pt-2 border-t border-zinc-300"><span>Total</span><span>£{total.toFixed(0)}</span></div>
          <div className="flex justify-between text-sm text-amber-700"><span>Deposit (30%)</span><span>£{(total*0.3).toFixed(0)}</span></div>
        </div>
      </div>

      {form.notes && (
        <div className="border-t border-zinc-200 pt-6 mb-6">
          <p className="text-xs uppercase tracking-widest text-zinc-400 mb-2">Notes & Inclusions</p>
          <p className="text-zinc-600 text-sm whitespace-pre-line">{form.notes}</p>
        </div>
      )}
      <div className="bg-zinc-50 p-4 text-sm text-zinc-500">
        <p>A 30% non-refundable deposit (£{(total*0.3).toFixed(0)}) is required to secure your booking. The remaining balance is due 30 days before the event. This quote is valid until {form.validUntil}.</p>
      </div>
      <div className="mt-8 pt-6 border-t border-zinc-100 text-center">
        <p className="text-zinc-400 text-xs">Thank you for considering Visual by Sherif</p>
      </div>
    </div>
  )
}
