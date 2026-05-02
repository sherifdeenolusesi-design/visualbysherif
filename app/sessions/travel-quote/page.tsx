'use client'

import { useState } from 'react'

function generateRef() {
  return `TRV-${new Date().getFullYear()}-${Math.floor(1000+Math.random()*9000)}`
}

const RATE_PER_MILE = 0.45
const OVERNIGHT_RATE = 120
const PARKING_RATE = 20

export default function TravelQuotePage() {
  const [ref] = useState(generateRef)
  const [form, setForm] = useState({
    clientName: '', sessionType: '', sessionDate: '',
    origin: 'Birmingham, West Midlands',
    destination: '', distance: '', returnTrip: true,
    overnight: '0', parking: false,
    additionalNotes: '',
  })
  const [preview, setPreview] = useState(false)
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const miles = parseFloat(form.distance) || 0
  const totalMiles = form.returnTrip ? miles * 2 : miles
  const mileageCost = totalMiles * RATE_PER_MILE
  const overnightCost = parseInt(form.overnight) * OVERNIGHT_RATE
  const parkingCost = form.parking ? PARKING_RATE : 0
  const total = mileageCost + overnightCost + parkingCost

  const inputCls = 'w-full bg-zinc-900 border border-zinc-800 text-white px-3 py-2.5 text-sm focus:outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-700'

  return (
    <div className="min-h-screen pt-16 bg-zinc-950">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-zinc-600 uppercase tracking-[0.4em] text-xs mb-2">Sessions</p>
            <h1 className="text-3xl font-thin text-white">Travel Quote</h1>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="border border-zinc-800 p-6 space-y-4">
                <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Client & Session</p>
                <div><label className="label-xs">Client Name</label><input className={inputCls} value={form.clientName} onChange={e => set('clientName', e.target.value)} placeholder="Jane Smith" /></div>
                <div><label className="label-xs">Session Type</label><input className={inputCls} value={form.sessionType} onChange={e => set('sessionType', e.target.value)} placeholder="Wedding, Elopement..." /></div>
                <div><label className="label-xs">Session Date</label><input type="date" className={inputCls} value={form.sessionDate} onChange={e => set('sessionDate', e.target.value)} /></div>
              </div>

              <div className="border border-zinc-800 p-6 space-y-4">
                <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Travel Details</p>
                <div><label className="label-xs">Travelling From</label><input className={inputCls} value={form.origin} onChange={e => set('origin', e.target.value)} /></div>
                <div><label className="label-xs">Destination</label><input className={inputCls} value={form.destination} onChange={e => set('destination', e.target.value)} placeholder="Venue name or city" /></div>
                <div><label className="label-xs">Distance (miles, one way)</label><input type="number" className={inputCls} value={form.distance} onChange={e => set('distance', e.target.value)} placeholder="0" min={0} /></div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="returnTrip" checked={form.returnTrip} onChange={e => set('returnTrip', e.target.checked)} className="w-4 h-4 accent-white" />
                  <label htmlFor="returnTrip" className="text-zinc-400 text-sm cursor-pointer">Return journey included</label>
                </div>
                <div><label className="label-xs">Overnight Stays (nights)</label>
                  <select className={inputCls} value={form.overnight} onChange={e => set('overnight', e.target.value)}>
                    {[0,1,2,3,4,5].map(n => <option key={n} value={n}>{n} night{n !== 1 ? 's' : ''}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="parking" checked={form.parking} onChange={e => set('parking', e.target.checked)} className="w-4 h-4 accent-white" />
                  <label htmlFor="parking" className="text-zinc-400 text-sm cursor-pointer">Parking charges included (£{PARKING_RATE})</label>
                </div>
              </div>

              <div className="border border-zinc-800 p-6">
                <label className="label-xs">Additional Notes</label>
                <textarea className={`${inputCls} mt-2`} rows={3} value={form.additionalNotes} onChange={e => set('additionalNotes', e.target.value)} placeholder="Any additional travel expenses or notes..." />
              </div>
            </div>

            <div className="border border-zinc-800 p-6 h-fit sticky top-20">
              <p className="text-zinc-500 text-xs uppercase tracking-widest mb-6">Quote Breakdown</p>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-zinc-500">Distance</span><span className="text-white">{totalMiles} miles {form.returnTrip ? '(return)' : '(one way)'}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Mileage (£{RATE_PER_MILE}/mile)</span><span className="text-white">£{mileageCost.toFixed(2)}</span></div>
                {overnightCost > 0 && <div className="flex justify-between"><span className="text-zinc-500">Overnight ({form.overnight} × £{OVERNIGHT_RATE})</span><span className="text-white">£{overnightCost.toFixed(2)}</span></div>}
                {form.parking && <div className="flex justify-between"><span className="text-zinc-500">Parking</span><span className="text-white">£{parkingCost.toFixed(2)}</span></div>}
                <div className="flex justify-between border-t border-zinc-700 pt-3 text-base">
                  <span className="text-white uppercase tracking-widest text-xs">Total Travel Fee</span>
                  <span className="text-white text-xl">£{total.toFixed(2)}</span>
                </div>
              </div>
              <p className="text-zinc-700 text-xs mt-6 leading-relaxed">Rate: HMRC approved mileage rate (£{RATE_PER_MILE}/mile). Overnight accommodation at £{OVERNIGHT_RATE}/night.</p>
            </div>
          </div>
        ) : (
          <TravelPreview ref_={ref} form={form} totalMiles={totalMiles} mileageCost={mileageCost} overnightCost={overnightCost} parkingCost={parkingCost} total={total} />
        )}
      </div>
      <style jsx global>{`.label-xs{display:block;color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px}@media print{nav,button{display:none!important}body{background:white!important;color:black!important}}`}</style>
    </div>
  )
}

function TravelPreview({ ref_, form, totalMiles, mileageCost, overnightCost, parkingCost, total }: any) {
  return (
    <div className="bg-white text-zinc-900 max-w-3xl mx-auto p-12 shadow-2xl">
      <div className="flex justify-between items-start mb-10">
        <div>
          <h2 className="text-2xl font-light tracking-widest uppercase mb-1">Visual by Sherif</h2>
          <p className="text-zinc-500 text-xs">Birmingham, West Midlands</p>
          <p className="text-zinc-500 text-xs">Virtualsbysherif@gmail.com</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-thin mb-1">TRAVEL QUOTE</p>
          <p className="text-zinc-500 text-sm font-mono">{ref_}</p>
          <p className="text-zinc-500 text-xs mt-1">{new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}</p>
        </div>
      </div>

      {form.clientName && (
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-zinc-400 mb-1">Prepared For</p>
          <p className="font-medium">{form.clientName}</p>
          {form.sessionType && <p className="text-zinc-600 text-sm">{form.sessionType}</p>}
          {form.sessionDate && <p className="text-zinc-600 text-sm">Session Date: {form.sessionDate}</p>}
        </div>
      )}

      <table className="w-full mb-6">
        <thead>
          <tr className="border-b-2 border-zinc-200">
            <th className="text-left py-2 text-xs uppercase tracking-widest text-zinc-400 font-normal">Item</th>
            <th className="text-right py-2 text-xs uppercase tracking-widest text-zinc-400 font-normal">Details</th>
            <th className="text-right py-2 text-xs uppercase tracking-widest text-zinc-400 font-normal w-28">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-zinc-100">
            <td className="py-3 text-sm">Mileage</td>
            <td className="py-3 text-sm text-right text-zinc-500">{form.origin} → {form.destination || '—'}<br/>{totalMiles} miles × £0.45</td>
            <td className="py-3 text-sm text-right font-medium">£{mileageCost.toFixed(2)}</td>
          </tr>
          {overnightCost > 0 && (
            <tr className="border-b border-zinc-100">
              <td className="py-3 text-sm">Overnight Accommodation</td>
              <td className="py-3 text-sm text-right text-zinc-500">{form.overnight} night(s) × £120</td>
              <td className="py-3 text-sm text-right font-medium">£{overnightCost.toFixed(2)}</td>
            </tr>
          )}
          {parkingCost > 0 && (
            <tr className="border-b border-zinc-100">
              <td className="py-3 text-sm">Parking</td>
              <td className="py-3 text-sm text-right text-zinc-500">Estimated</td>
              <td className="py-3 text-sm text-right font-medium">£{parkingCost.toFixed(2)}</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="flex justify-end mb-8">
        <div className="w-48">
          <div className="flex justify-between text-lg font-medium pt-2 border-t border-zinc-300">
            <span>Total</span><span>£{total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {form.additionalNotes && (
        <div className="border-t border-zinc-200 pt-6">
          <p className="text-xs uppercase tracking-widest text-zinc-400 mb-2">Notes</p>
          <p className="text-zinc-600 text-sm">{form.additionalNotes}</p>
        </div>
      )}
      <div className="mt-10 pt-6 border-t border-zinc-100 text-center">
        <p className="text-zinc-400 text-xs">Visual by Sherif — Virtualsbysherif@gmail.com</p>
      </div>
    </div>
  )
}
