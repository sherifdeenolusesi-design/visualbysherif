'use client'

import { useState } from 'react'

function generateRef() {
  const d = new Date()
  return `DEP-${d.getFullYear().toString().slice(2)}${String(d.getMonth()+1).padStart(2,'0')}-${Math.floor(1000+Math.random()*9000)}`
}

const today = () => new Date().toISOString().split('T')[0]
const addDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString().split('T')[0]

export default function DepositPage() {
  const [ref] = useState(generateRef)
  const [form, setForm] = useState({
    clientName: '', clientEmail: '', clientAddress: '',
    sessionType: '', sessionDate: '', location: '',
    totalAmount: '', depositPct: '30',
    issueDate: today(), dueDate: addDays(7), notes: '',
  })
  const [preview, setPreview] = useState(false)

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const totalAmt = parseFloat(form.totalAmount) || 0
  const pct = parseFloat(form.depositPct) || 30
  const depositAmt = totalAmt * pct / 100
  const balance = totalAmt - depositAmt

  const inputCls = 'w-full bg-zinc-900 border border-zinc-800 text-white px-3 py-2.5 text-sm focus:outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-700'

  return (
    <div className="min-h-screen pt-16 bg-zinc-950">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-zinc-600 uppercase tracking-[0.4em] text-xs mb-2">Sessions</p>
            <h1 className="text-3xl font-thin text-white">Deposit Invoice</h1>
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
                <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Client Details</p>
                <div><label className="label-xs">Reference</label><input className={inputCls} value={ref} readOnly /></div>
                <div><label className="label-xs">Client Name *</label><input className={inputCls} value={form.clientName} onChange={e => set('clientName', e.target.value)} placeholder="Jane Smith" /></div>
                <div><label className="label-xs">Client Email</label><input className={inputCls} value={form.clientEmail} onChange={e => set('clientEmail', e.target.value)} placeholder="jane@example.com" /></div>
                <div><label className="label-xs">Client Address</label><textarea className={inputCls} rows={2} value={form.clientAddress} onChange={e => set('clientAddress', e.target.value)} /></div>
              </div>

              <div className="border border-zinc-800 p-6 space-y-4">
                <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Session & Payment</p>
                <div><label className="label-xs">Session Type</label><input className={inputCls} value={form.sessionType} onChange={e => set('sessionType', e.target.value)} placeholder="Wedding Photography" /></div>
                <div><label className="label-xs">Session Date</label><input type="date" className={inputCls} value={form.sessionDate} onChange={e => set('sessionDate', e.target.value)} /></div>
                <div><label className="label-xs">Location</label><input className={inputCls} value={form.location} onChange={e => set('location', e.target.value)} placeholder="Birmingham, West Midlands" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label-xs">Total Package £</label><input type="number" className={inputCls} value={form.totalAmount} onChange={e => set('totalAmount', e.target.value)} placeholder="2000" /></div>
                  <div><label className="label-xs">Deposit %</label><input type="number" className={inputCls} value={form.depositPct} onChange={e => set('depositPct', e.target.value)} min={1} max={100} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label-xs">Issue Date</label><input type="date" className={inputCls} value={form.issueDate} onChange={e => set('issueDate', e.target.value)} /></div>
                  <div><label className="label-xs">Due Date</label><input type="date" className={inputCls} value={form.dueDate} onChange={e => set('dueDate', e.target.value)} /></div>
                </div>
              </div>

              <div className="border border-zinc-800 p-6">
                <label className="label-xs">Payment Instructions / Notes</label>
                <textarea className={`${inputCls} mt-2`} rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Bank transfer details, sort code, account number..." />
              </div>
            </div>

            <div className="border border-zinc-800 p-6 h-fit sticky top-20 space-y-4">
              <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Breakdown</p>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-zinc-500">Total Package</span><span className="text-white">£{totalAmt.toFixed(2)}</span></div>
                <div className="flex justify-between text-amber-400 font-light">
                  <span>Deposit ({pct}%) — Due Now</span>
                  <span className="text-xl">£{depositAmt.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-zinc-800 pt-3"><span className="text-zinc-500">Remaining Balance</span><span className="text-zinc-400">£{balance.toFixed(2)}</span></div>
              </div>
              <p className="text-zinc-700 text-xs leading-relaxed mt-4">Remaining balance is due 7 days before the session date.</p>
            </div>
          </div>
        ) : (
          <DepositPreview ref_={ref} form={form} depositAmt={depositAmt} balance={balance} pct={pct} totalAmt={totalAmt} />
        )}
      </div>
      <style jsx global>{`.label-xs{display:block;color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px}@media print{nav,button,.no-print{display:none!important}body{background:white!important;color:black!important}}`}</style>
    </div>
  )
}

function DepositPreview({ ref_, form, depositAmt, balance, pct, totalAmt }: any) {
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
          <p className="text-3xl font-thin mb-1">DEPOSIT INVOICE</p>
          <p className="text-zinc-500 text-sm font-mono">{ref_}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-10">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-400 mb-2">Bill To</p>
          <p className="font-medium">{form.clientName || '—'}</p>
          {form.clientEmail && <p className="text-zinc-600 text-sm">{form.clientEmail}</p>}
          {form.clientAddress && <p className="text-zinc-600 text-sm whitespace-pre-line">{form.clientAddress}</p>}
        </div>
        <div className="text-right space-y-1 text-sm">
          <div className="flex justify-end gap-6"><span className="text-zinc-400">Issue Date</span><span>{form.issueDate}</span></div>
          <div className="flex justify-end gap-6"><span className="text-zinc-400">Due Date</span><span className="font-medium">{form.dueDate}</span></div>
          {form.sessionDate && <div className="flex justify-end gap-6"><span className="text-zinc-400">Session Date</span><span>{form.sessionDate}</span></div>}
          {form.sessionType && <div className="flex justify-end gap-6"><span className="text-zinc-400">Service</span><span>{form.sessionType}</span></div>}
          {form.location && <div className="flex justify-end gap-6"><span className="text-zinc-400">Location</span><span>{form.location}</span></div>}
        </div>
      </div>

      <div className="border border-zinc-200 p-6 mb-6 bg-amber-50">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium text-zinc-900">Booking Deposit — {pct}%</p>
            <p className="text-zinc-500 text-sm mt-1">Non-refundable deposit to secure your booking date</p>
            {form.sessionType && <p className="text-zinc-500 text-sm">{form.sessionType}</p>}
          </div>
          <p className="text-3xl font-light text-zinc-900">£{depositAmt.toFixed(2)}</p>
        </div>
      </div>

      <div className="flex justify-end mb-8">
        <div className="w-64 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-zinc-500">Total Package</span><span>£{totalAmt.toFixed(2)}</span></div>
          <div className="flex justify-between text-amber-700 font-medium"><span>Deposit Due Now ({pct}%)</span><span>£{depositAmt.toFixed(2)}</span></div>
          <div className="flex justify-between border-t border-zinc-200 pt-2"><span className="text-zinc-400">Remaining Balance</span><span className="text-zinc-500">£{balance.toFixed(2)}</span></div>
        </div>
      </div>

      <div className="border-t border-zinc-200 pt-6 space-y-2">
        <p className="text-xs uppercase tracking-widest text-zinc-400">Payment & Terms</p>
        <p className="text-zinc-600 text-sm">{form.notes || 'Please pay the deposit within 7 days to secure your booking. The remaining balance is due 7 days before your session date.'}</p>
        <p className="text-zinc-500 text-xs mt-3">This deposit is non-refundable. By making payment you agree to our terms and conditions.</p>
      </div>

      <div className="mt-10 pt-6 border-t border-zinc-100 text-center">
        <p className="text-zinc-400 text-xs">Thank you for booking with Visual by Sherif</p>
      </div>
    </div>
  )
}
