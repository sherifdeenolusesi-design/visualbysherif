'use client'

import { useState } from 'react'

interface LineItem { description: string; qty: number; rate: number }

function generateInvoiceNumber() {
  const date = new Date()
  const yy = date.getFullYear().toString().slice(2)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `VBS-${yy}${mm}-${rand}`
}

const today = () => new Date().toISOString().split('T')[0]
const addDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString().split('T')[0]

export default function InvoicePage() {
  const [invoiceNo] = useState(generateInvoiceNumber)
  const [form, setForm] = useState({
    clientName: '', clientEmail: '', clientAddress: '',
    sessionType: '', sessionDate: '', location: '',
    issueDate: today(), dueDate: addDays(14), notes: '',
  })
  const [items, setItems] = useState<LineItem[]>([
    { description: 'Photography Session', qty: 1, rate: 0 },
  ])
  const [vatRate] = useState(20)
  const [showPreview, setShowPreview] = useState(false)

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const subtotal = items.reduce((s, i) => s + i.qty * i.rate, 0)
  const vat = subtotal * vatRate / 100
  const total = subtotal + vat

  const addItem = () => setItems(p => [...p, { description: '', qty: 1, rate: 0 }])
  const removeItem = (i: number) => setItems(p => p.filter((_, idx) => idx !== i))
  const setItem = (i: number, k: keyof LineItem, v: string | number) =>
    setItems(p => p.map((item, idx) => idx === i ? { ...item, [k]: v } : item))

  const inputCls = 'w-full bg-zinc-900 border border-zinc-800 text-white px-3 py-2.5 text-sm focus:outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-700'

  return (
    <div className="min-h-screen pt-16 bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-zinc-600 uppercase tracking-[0.4em] text-xs mb-2">Sessions</p>
            <h1 className="text-3xl font-thin text-white">Invoice Generator</h1>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowPreview(p => !p)} className="border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 px-5 py-2.5 text-xs uppercase tracking-widest transition-colors">
              {showPreview ? 'Edit' : 'Preview'}
            </button>
            <button onClick={() => window.print()} className="bg-white text-zinc-950 px-5 py-2.5 text-xs uppercase tracking-widest hover:bg-zinc-100 transition-colors">
              Print / Download
            </button>
          </div>
        </div>

        {!showPreview ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form */}
            <div className="space-y-6">
              <div className="border border-zinc-800 p-6 space-y-4">
                <p className="text-zinc-500 text-xs uppercase tracking-widest mb-4">Client Details</p>
                <div><label className="label-xs">Invoice No.</label><input className={inputCls} value={invoiceNo} readOnly /></div>
                <div><label className="label-xs">Client Name *</label><input className={inputCls} value={form.clientName} onChange={e => set('clientName', e.target.value)} placeholder="Jane Smith" /></div>
                <div><label className="label-xs">Client Email</label><input className={inputCls} value={form.clientEmail} onChange={e => set('clientEmail', e.target.value)} placeholder="jane@example.com" /></div>
                <div><label className="label-xs">Client Address</label><textarea className={inputCls} rows={2} value={form.clientAddress} onChange={e => set('clientAddress', e.target.value)} placeholder="123 High Street, Birmingham" /></div>
              </div>

              <div className="border border-zinc-800 p-6 space-y-4">
                <p className="text-zinc-500 text-xs uppercase tracking-widest mb-4">Session Details</p>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label-xs">Issue Date</label><input type="date" className={inputCls} value={form.issueDate} onChange={e => set('issueDate', e.target.value)} /></div>
                  <div><label className="label-xs">Due Date</label><input type="date" className={inputCls} value={form.dueDate} onChange={e => set('dueDate', e.target.value)} /></div>
                </div>
                <div><label className="label-xs">Session Type</label><input className={inputCls} value={form.sessionType} onChange={e => set('sessionType', e.target.value)} placeholder="Wedding, Portrait, Event..." /></div>
                <div><label className="label-xs">Session Date</label><input type="date" className={inputCls} value={form.sessionDate} onChange={e => set('sessionDate', e.target.value)} /></div>
                <div><label className="label-xs">Location</label><input className={inputCls} value={form.location} onChange={e => set('location', e.target.value)} placeholder="Birmingham, West Midlands" /></div>
              </div>

              <div className="border border-zinc-800 p-6 space-y-3">
                <p className="text-zinc-500 text-xs uppercase tracking-widest mb-4">Line Items</p>
                {items.map((item, i) => (
                  <div key={i} className="grid grid-cols-[1fr_60px_80px_32px] gap-2 items-center">
                    <input className={inputCls} value={item.description} onChange={e => setItem(i, 'description', e.target.value)} placeholder="Description" />
                    <input type="number" className={inputCls} value={item.qty} onChange={e => setItem(i, 'qty', +e.target.value)} min={1} />
                    <input type="number" className={inputCls} value={item.rate} onChange={e => setItem(i, 'rate', +e.target.value)} placeholder="£0" />
                    <button onClick={() => removeItem(i)} className="text-zinc-700 hover:text-red-400 transition-colors text-lg leading-none">×</button>
                  </div>
                ))}
                <div className="grid grid-cols-[1fr_60px_80px_32px] gap-2 text-zinc-700 text-[10px] uppercase tracking-widest px-0.5">
                  <span>Description</span><span>Qty</span><span>Rate £</span><span></span>
                </div>
                <button onClick={addItem} className="text-zinc-600 hover:text-white text-xs uppercase tracking-widest transition-colors">+ Add Line Item</button>
              </div>

              <div className="border border-zinc-800 p-6">
                <label className="label-xs">Notes / Payment Terms</label>
                <textarea className={`${inputCls} mt-2`} rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Bank transfer details, payment instructions..." />
              </div>
            </div>

            {/* Live totals */}
            <div className="border border-zinc-800 p-6 h-fit sticky top-20">
              <p className="text-zinc-500 text-xs uppercase tracking-widest mb-6">Summary</p>
              <div className="space-y-3 mb-6">
                {items.map((item, i) => item.description && (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-zinc-400 truncate max-w-[60%]">{item.description}</span>
                    <span className="text-white">£{(item.qty * item.rate).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-zinc-800 pt-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-zinc-500">Subtotal</span><span className="text-white">£{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-zinc-500">VAT ({vatRate}%)</span><span className="text-white">£{vat.toFixed(2)}</span></div>
                <div className="flex justify-between text-base font-light pt-2 border-t border-zinc-700">
                  <span className="text-white uppercase tracking-widest text-xs">Total</span>
                  <span className="text-white text-xl">£{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <InvoicePreview invoiceNo={invoiceNo} form={form} items={items} subtotal={subtotal} vat={vat} total={total} vatRate={vatRate} />
        )}
      </div>

      <style jsx global>{`
        .label-xs { display: block; color: #71717a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px; }
        @media print {
          nav, button, .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .print-invoice { display: block !important; }
        }
      `}</style>
    </div>
  )
}

function InvoicePreview({ invoiceNo, form, items, subtotal, vat, total, vatRate }: {
  invoiceNo: string; form: any; items: LineItem[]; subtotal: number; vat: number; total: number; vatRate: number
}) {
  return (
    <div className="bg-white text-zinc-900 max-w-3xl mx-auto p-12 shadow-2xl">
      <div className="flex justify-between items-start mb-10">
        <div>
          <h2 className="text-2xl font-light tracking-widest text-zinc-900 uppercase mb-1">Visual by Sherif</h2>
          <p className="text-zinc-500 text-xs">Photography & Cinematography</p>
          <p className="text-zinc-500 text-xs">Birmingham, West Midlands</p>
          <p className="text-zinc-500 text-xs">Virtualsbysherif@gmail.com</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-thin text-zinc-900 mb-1">INVOICE</p>
          <p className="text-zinc-500 text-sm font-mono">{invoiceNo}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-10">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-400 mb-2">Bill To</p>
          <p className="font-medium text-zinc-900">{form.clientName || '—'}</p>
          {form.clientEmail && <p className="text-zinc-600 text-sm">{form.clientEmail}</p>}
          {form.clientAddress && <p className="text-zinc-600 text-sm whitespace-pre-line">{form.clientAddress}</p>}
        </div>
        <div className="text-right">
          <div className="space-y-1 text-sm">
            <div className="flex justify-end gap-6"><span className="text-zinc-400">Issue Date</span><span className="text-zinc-900">{form.issueDate}</span></div>
            <div className="flex justify-end gap-6"><span className="text-zinc-400">Due Date</span><span className="text-zinc-900 font-medium">{form.dueDate}</span></div>
            {form.sessionDate && <div className="flex justify-end gap-6"><span className="text-zinc-400">Session Date</span><span className="text-zinc-900">{form.sessionDate}</span></div>}
            {form.sessionType && <div className="flex justify-end gap-6"><span className="text-zinc-400">Session Type</span><span className="text-zinc-900">{form.sessionType}</span></div>}
            {form.location && <div className="flex justify-end gap-6"><span className="text-zinc-400">Location</span><span className="text-zinc-900">{form.location}</span></div>}
          </div>
        </div>
      </div>

      <table className="w-full mb-6">
        <thead>
          <tr className="border-b-2 border-zinc-200">
            <th className="text-left py-2 text-xs uppercase tracking-widest text-zinc-400 font-normal">Description</th>
            <th className="text-center py-2 text-xs uppercase tracking-widest text-zinc-400 font-normal w-16">Qty</th>
            <th className="text-right py-2 text-xs uppercase tracking-widest text-zinc-400 font-normal w-24">Rate</th>
            <th className="text-right py-2 text-xs uppercase tracking-widest text-zinc-400 font-normal w-24">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => item.description && (
            <tr key={i} className="border-b border-zinc-100">
              <td className="py-3 text-sm text-zinc-800">{item.description}</td>
              <td className="py-3 text-sm text-center text-zinc-600">{item.qty}</td>
              <td className="py-3 text-sm text-right text-zinc-600">£{item.rate.toFixed(2)}</td>
              <td className="py-3 text-sm text-right text-zinc-900 font-medium">£{(item.qty * item.rate).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mb-8">
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-sm"><span className="text-zinc-500">Subtotal</span><span>£{subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-zinc-500">VAT ({vatRate}%)</span><span>£{vat.toFixed(2)}</span></div>
          <div className="flex justify-between text-base font-medium pt-2 border-t border-zinc-300">
            <span>Total Due</span><span className="text-xl">£{total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {form.notes && (
        <div className="border-t border-zinc-200 pt-6">
          <p className="text-xs uppercase tracking-widest text-zinc-400 mb-2">Notes & Payment Details</p>
          <p className="text-zinc-600 text-sm whitespace-pre-line">{form.notes}</p>
        </div>
      )}

      <div className="mt-10 pt-6 border-t border-zinc-100 text-center">
        <p className="text-zinc-400 text-xs">Thank you for choosing Visual by Sherif</p>
      </div>
    </div>
  )
}
