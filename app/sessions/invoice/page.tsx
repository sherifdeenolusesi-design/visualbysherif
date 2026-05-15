'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface LineItem { description: string; qty: number; rate: number }
interface BankDetails { accountName: string; sortCode: string; accountNo: string; bankName: string; reference: string }
interface SavedInvoice {
  id: string; invoice_no: string; client_name: string; client_email: string
  session_type: string; session_date: string; total_amount: number; status: string; created_at: string
}

function generateInvoiceNumber() {
  const date = new Date()
  const yy = date.getFullYear().toString().slice(2)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `VBS-${yy}${mm}-${rand}`
}

const today = () => new Date().toISOString().split('T')[0]
const addDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString().split('T')[0]
const fmtDate = (d: string) => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'
const fmtShort = (d: string) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

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
  const [bank, setBank] = useState<BankDetails>({
    accountName: '', sortCode: '', accountNo: '', bankName: '', reference: '',
  })
  const [showPreview, setShowPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [history, setHistory] = useState<SavedInvoice[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))
  const setB = (k: keyof BankDetails, v: string) => setBank(p => ({ ...p, [k]: v }))

  const total = items.reduce((s, i) => s + i.qty * i.rate, 0)
  const addItem = () => setItems(p => [...p, { description: '', qty: 1, rate: 0 }])
  const removeItem = (i: number) => setItems(p => p.filter((_, idx) => idx !== i))
  const setItem = (i: number, k: keyof LineItem, v: string | number) =>
    setItems(p => p.map((item, idx) => idx === i ? { ...item, [k]: v } : item))

  const hasBankDetails = bank.accountName && bank.sortCode && bank.accountNo
  const bankQrText = hasBankDetails
    ? `Pay: ${bank.accountName}\nSort Code: ${bank.sortCode}\nAccount: ${bank.accountNo}${bank.bankName ? `\nBank: ${bank.bankName}` : ''}\nAmount: £${total.toFixed(2)}\nRef: ${bank.reference || invoiceNo}`
    : ''

  const fetchHistory = async () => {
    setHistoryLoading(true)
    const res = await fetch('/api/invoices')
    const data = await res.json()
    setHistory(data.invoices ?? [])
    setHistoryLoading(false)
  }

  const saveInvoice = async () => {
    setSaving(true); setSavedMsg('')
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_no: invoiceNo, form, items, total_amount: total, bank_details: hasBankDetails ? bank : null }),
      })
      if (res.ok) { setSavedMsg('✓ Invoice saved'); fetchHistory() }
      else setSavedMsg('Save failed — try again')
    } catch { setSavedMsg('Save failed — try again') }
    finally { setSaving(false); setTimeout(() => setSavedMsg(''), 3000) }
  }

  const loadInvoice = async (inv: SavedInvoice) => {
    const res = await fetch(`/api/invoices?id=${inv.id}`)
    const data = await res.json()
    const full = data.invoices?.[0]
    if (full?.form_data) { setForm(full.form_data); if (full.items) setItems(full.items); if (full.bank_details) setBank(full.bank_details); setHistoryOpen(false) }
  }

  const markPaid = async (id: string) => {
    await fetch('/api/invoices', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: 'paid' }) })
    fetchHistory()
  }

  const deleteInvoice = async (id: string) => {
    if (!confirm('Delete this invoice?')) return
    await fetch('/api/invoices', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    fetchHistory()
  }

  const inputCls = 'w-full bg-zinc-900 border border-zinc-800 text-white px-3 py-2.5 text-sm focus:outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-700'

  return (
    <div className="min-h-screen pt-16 bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <p className="text-zinc-600 uppercase tracking-[0.4em] text-xs mb-2">Sessions</p>
            <h1 className="text-3xl font-thin text-white">Invoice Generator</h1>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button onClick={() => { setHistoryOpen(o => !o); if (!historyOpen) fetchHistory() }}
              className="border border-zinc-700 text-zinc-400 hover:text-white px-5 py-2.5 text-xs uppercase tracking-widest transition-colors">
              📋 History {history.length > 0 && `(${history.length})`}
            </button>
            <button onClick={saveInvoice} disabled={saving}
              className="border border-amber-500/50 text-amber-400 hover:border-amber-400 px-5 py-2.5 text-xs uppercase tracking-widest transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : '✦ Save Invoice'}
            </button>
            <button onClick={() => setShowPreview(p => !p)}
              className="border border-zinc-700 text-zinc-400 hover:text-white px-5 py-2.5 text-xs uppercase tracking-widest transition-colors">
              {showPreview ? 'Edit' : 'Preview'}
            </button>
            <button onClick={() => window.print()} className="bg-white text-zinc-950 px-5 py-2.5 text-xs uppercase tracking-widest hover:bg-zinc-100 transition-colors">
              Print / PDF
            </button>
          </div>
        </div>

        {savedMsg && <div className="mb-4 px-4 py-2 border border-green-800 bg-green-950/30 text-green-400 text-xs uppercase tracking-widest">{savedMsg}</div>}

        {/* History panel */}
        {historyOpen && (
          <div className="mb-8 border border-zinc-800 bg-zinc-900/50">
            <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
              <p className="text-white text-sm uppercase tracking-widest">Saved Invoices</p>
              <button onClick={() => setHistoryOpen(false)} className="text-zinc-600 hover:text-white text-xs">✕ Close</button>
            </div>
            {historyLoading ? (
              <p className="text-zinc-500 text-sm p-6 text-center">Loading…</p>
            ) : history.length === 0 ? (
              <p className="text-zinc-600 text-sm p-6 text-center">No saved invoices yet.</p>
            ) : (
              <div className="divide-y divide-zinc-800">
                {history.map(inv => (
                  <div key={inv.id} className="flex items-center gap-4 px-5 py-4 hover:bg-zinc-900/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-white text-sm font-light truncate">{inv.client_name || 'Unnamed'}</span>
                        <span className={`text-[10px] px-2 py-0.5 border ${inv.status === 'paid' ? 'border-green-800 text-green-400' : 'border-amber-800 text-amber-400'}`}>{inv.status}</span>
                        {inv.session_type && <span className="text-zinc-500 text-[10px]">{inv.session_type}</span>}
                      </div>
                      <div className="flex items-center gap-3 text-zinc-600 text-xs">
                        <span className="font-mono">{inv.invoice_no}</span>
                        <span>·</span><span>£{Number(inv.total_amount).toFixed(2)}</span>
                        <span>·</span><span>Saved {fmtShort(inv.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => loadInvoice(inv)} className="text-[10px] uppercase tracking-widest border border-zinc-700 text-zinc-400 px-3 py-1.5 hover:border-white hover:text-white transition-colors">Load</button>
                      {inv.status !== 'paid' && <button onClick={() => markPaid(inv.id)} className="text-[10px] uppercase tracking-widest border border-green-900 text-green-600 px-3 py-1.5 hover:border-green-500 hover:text-green-400 transition-colors">Paid</button>}
                      <button onClick={() => deleteInvoice(inv.id)} className="text-[10px] uppercase tracking-widest border border-red-900 text-red-700 px-3 py-1.5 hover:border-red-500 hover:text-red-400 transition-colors">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!showPreview ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">

              {/* Client details */}
              <div className="border border-zinc-800 p-6 space-y-4">
                <p className="text-zinc-500 text-xs uppercase tracking-widest mb-4">Client Details</p>
                <div><label className="label-xs">Invoice No.</label><input className={inputCls} value={invoiceNo} readOnly /></div>
                <div><label className="label-xs">Client Name *</label><input className={inputCls} value={form.clientName} onChange={e => set('clientName', e.target.value)} placeholder="Jane Smith" /></div>
                <div><label className="label-xs">Client Email</label><input className={inputCls} value={form.clientEmail} onChange={e => set('clientEmail', e.target.value)} placeholder="jane@example.com" /></div>
                <div><label className="label-xs">Client Address</label><textarea className={inputCls} rows={2} value={form.clientAddress} onChange={e => set('clientAddress', e.target.value)} placeholder="123 High Street, Birmingham" /></div>
              </div>

              {/* Session details */}
              <div className="border border-zinc-800 p-6 space-y-4">
                <p className="text-zinc-500 text-xs uppercase tracking-widest mb-4">Session Details</p>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label-xs">Issue Date</label><input type="date" className={inputCls} value={form.issueDate} onChange={e => set('issueDate', e.target.value)} /></div>
                  <div><label className="label-xs">Due Date</label><input type="date" className={inputCls} value={form.dueDate} onChange={e => set('dueDate', e.target.value)} /></div>
                </div>
                <div><label className="label-xs">Session Type</label><input className={inputCls} value={form.sessionType} onChange={e => set('sessionType', e.target.value)} placeholder="Wedding, Portrait, Event…" /></div>
                <div><label className="label-xs">Session Date</label><input type="date" className={inputCls} value={form.sessionDate} onChange={e => set('sessionDate', e.target.value)} /></div>
                <div><label className="label-xs">Location</label><input className={inputCls} value={form.location} onChange={e => set('location', e.target.value)} placeholder="Birmingham, West Midlands" /></div>
              </div>

              {/* Line items */}
              <div className="border border-zinc-800 p-6 space-y-3">
                <p className="text-zinc-500 text-xs uppercase tracking-widest mb-4">Line Items</p>
                <div className="grid grid-cols-[1fr_60px_80px_32px] gap-2 text-zinc-600 text-[10px] uppercase tracking-widest px-0.5 mb-1">
                  <span>Description</span><span>Qty</span><span>Rate £</span><span></span>
                </div>
                {items.map((item, i) => (
                  <div key={i} className="grid grid-cols-[1fr_60px_80px_32px] gap-2 items-center">
                    <input className={inputCls} value={item.description} onChange={e => setItem(i, 'description', e.target.value)} placeholder="Description" />
                    <input type="number" className={inputCls} value={item.qty} onChange={e => setItem(i, 'qty', +e.target.value)} min={1} />
                    <input type="number" className={inputCls} value={item.rate} onChange={e => setItem(i, 'rate', +e.target.value)} placeholder="0" />
                    <button onClick={() => removeItem(i)} className="text-zinc-700 hover:text-red-400 transition-colors text-lg leading-none">×</button>
                  </div>
                ))}
                <button onClick={addItem} className="text-zinc-600 hover:text-white text-xs uppercase tracking-widest transition-colors">+ Add Line Item</button>
              </div>

              {/* Notes */}
              <div className="border border-zinc-800 p-6">
                <label className="label-xs">Notes</label>
                <textarea className={`${inputCls} mt-2`} rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any additional notes for the client…" />
              </div>

              {/* Bank details */}
              <div className="border border-zinc-800 p-6 space-y-4">
                <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Bank Details for Payment QR</p>
                <p className="text-zinc-600 text-xs mb-4">Fill in your bank details to generate a QR code on the invoice.</p>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label-xs">Account Name *</label><input className={inputCls} value={bank.accountName} onChange={e => setB('accountName', e.target.value)} placeholder="Visual by Sherif" /></div>
                  <div><label className="label-xs">Bank Name</label><input className={inputCls} value={bank.bankName} onChange={e => setB('bankName', e.target.value)} placeholder="Barclays, HSBC…" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label-xs">Sort Code *</label><input className={inputCls} value={bank.sortCode} onChange={e => setB('sortCode', e.target.value)} placeholder="00-00-00" /></div>
                  <div><label className="label-xs">Account Number *</label><input className={inputCls} value={bank.accountNo} onChange={e => setB('accountNo', e.target.value)} placeholder="12345678" /></div>
                </div>
                <div><label className="label-xs">Payment Reference</label><input className={inputCls} value={bank.reference} onChange={e => setB('reference', e.target.value)} placeholder={invoiceNo} /></div>
                {hasBankDetails && (
                  <div className="flex items-start gap-4 p-4 border border-zinc-700 bg-zinc-900/50 mt-2">
                    <div className="bg-white p-2 flex-shrink-0">
                      <QRCodeSVG value={bankQrText} size={96} />
                    </div>
                    <div>
                      <p className="text-green-400 text-xs uppercase tracking-widest mb-1">✓ QR Code Generated</p>
                      <p className="text-zinc-500 text-xs leading-relaxed">This QR code will appear on the invoice. Clients can scan it to see your bank details for payment.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Summary panel */}
            <div className="border border-zinc-800 p-6 h-fit sticky top-20 space-y-3">
              <p className="text-zinc-500 text-xs uppercase tracking-widest mb-4">Summary</p>
              <div className="space-y-2 mb-6">
                {items.map((item, i) => item.description && (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-zinc-400 truncate max-w-[60%]">{item.description} × {item.qty}</span>
                    <span className="text-white">£{(item.qty * item.rate).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-zinc-800 pt-4">
                <div className="flex justify-between text-base font-light">
                  <span className="text-white uppercase tracking-widest text-xs">Total Due</span>
                  <span className="text-white text-2xl">£{total.toFixed(2)}</span>
                </div>
              </div>
              <div className="border-t border-zinc-800 pt-3 space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-zinc-500">Invoice</span><span className="text-white font-mono">{invoiceNo}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Client</span><span className="text-white truncate max-w-[120px]">{form.clientName || '—'}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Due</span><span className="text-white">{form.dueDate || '—'}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Bank QR</span><span className={hasBankDetails ? 'text-green-400' : 'text-zinc-600'}>{hasBankDetails ? '✓ Ready' : 'Not set'}</span></div>
              </div>
            </div>
          </div>
        ) : (
          <InvoicePreview invoiceNo={invoiceNo} form={form} items={items} total={total} bank={bank} bankQrText={bankQrText} />
        )}
      </div>

      <style jsx global>{`
        .label-xs { display:block; color:#71717a; font-size:11px; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:6px; }
        @media print {
          nav, button, .no-print { display:none !important; }
          body { background:white !important; color:black !important; }
        }
      `}</style>
    </div>
  )
}

function InvoicePreview({ invoiceNo, form, items, total, bank, bankQrText }: {
  invoiceNo: string; form: any; items: LineItem[]; total: number
  bank: BankDetails; bankQrText: string
}) {
  const hasBankDetails = bank.accountName && bank.sortCode && bank.accountNo
  return (
    <div className="bg-white text-zinc-900 max-w-3xl mx-auto shadow-2xl" style={{ fontFamily: 'Georgia, serif' }}>
      {/* Header */}
      <div style={{ background: '#1A1814', padding: '28px 40px 20px' }}>
        <div style={{ height: '3px', background: 'linear-gradient(to right,#B8962E,#E8C96A,#B8962E)', marginBottom: '20px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ background: 'white', borderRadius: '50%', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #B8962E', overflow: 'hidden' }}>
              <img src="/logo/logo.png" alt="" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
            </div>
            <div>
              <p style={{ color: 'white', fontSize: '16px', letterSpacing: '0.25em', textTransform: 'uppercase', margin: 0 }}>Visual by Sherif</p>
              <p style={{ color: '#B8962E', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '3px 0 0', fontFamily: 'sans-serif' }}>Photography & Cinematography</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: '#B8962E', fontSize: '9px', letterSpacing: '0.25em', textTransform: 'uppercase', margin: '0 0 4px', fontFamily: 'sans-serif' }}>Invoice</p>
            <p style={{ color: 'white', fontSize: '24px', fontWeight: 300, letterSpacing: '0.1em', margin: 0 }}>INVOICE</p>
            <p style={{ color: '#B8962E', fontFamily: 'monospace', fontSize: '11px', margin: '4px 0 0' }}>{invoiceNo}</p>
          </div>
        </div>
        <div style={{ height: '1px', background: 'linear-gradient(to right,transparent,#B8962E,transparent)', marginTop: '20px' }} />
      </div>

      {/* Meta */}
      <div style={{ background: '#F9F3E3', borderBottom: '1px solid #E8D9A8', padding: '10px 40px', display: 'flex', gap: '36px', fontFamily: 'sans-serif' }}>
        {[['Issue Date', fmtDate(form.issueDate)], ['Due Date', fmtDate(form.dueDate)], ['Reference', invoiceNo]].map(([k, v]) => (
          <div key={k}>
            <p style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#888', margin: '0 0 2px' }}>{k}</p>
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#1A1814', margin: 0 }}>{v}</p>
          </div>
        ))}
      </div>

      <div style={{ padding: '32px 40px' }}>
        {/* Parties */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px' }}>
          <div style={{ border: '1px solid #E8D9A8', borderTop: '3px solid #B8962E', padding: '14px 16px', background: '#F9F3E3' }}>
            <p style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#B8962E', margin: '0 0 8px', fontFamily: 'sans-serif' }}>From</p>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#1A1814', margin: '0 0 4px' }}>Visual by Sherif</p>
            <p style={{ fontSize: '10px', color: '#555', margin: 0, fontFamily: 'sans-serif' }}>Birmingham, West Midlands</p>
            <p style={{ fontSize: '10px', color: '#555', margin: 0, fontFamily: 'sans-serif' }}>visualbysherif@gmail.com</p>
          </div>
          <div style={{ border: '1px solid #DDD', borderTop: '3px solid #AAA', padding: '14px 16px', background: '#FAFAFA' }}>
            <p style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#888', margin: '0 0 8px', fontFamily: 'sans-serif' }}>Bill To</p>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#1A1814', margin: '0 0 4px' }}>{form.clientName || '—'}</p>
            {form.clientEmail && <p style={{ fontSize: '10px', color: '#555', margin: 0, fontFamily: 'sans-serif' }}>{form.clientEmail}</p>}
            {form.clientAddress && <p style={{ fontSize: '10px', color: '#555', margin: 0, fontFamily: 'sans-serif', whiteSpace: 'pre-line' }}>{form.clientAddress}</p>}
          </div>
        </div>

        {/* Session info */}
        {(form.sessionType || form.sessionDate || form.location) && (
          <div style={{ background: '#FAFAFA', border: '1px solid #EEE', padding: '12px 16px', marginBottom: '24px', fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
              {form.sessionType && <div><p style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#888', margin: '0 0 2px' }}>Session</p><p style={{ fontSize: '11px', fontWeight: 600, color: '#1A1814', margin: 0 }}>{form.sessionType}</p></div>}
              {form.sessionDate && <div><p style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#888', margin: '0 0 2px' }}>Date</p><p style={{ fontSize: '11px', fontWeight: 600, color: '#1A1814', margin: 0 }}>{fmtDate(form.sessionDate)}</p></div>}
              {form.location && <div><p style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#888', margin: '0 0 2px' }}>Location</p><p style={{ fontSize: '11px', fontWeight: 600, color: '#1A1814', margin: 0 }}>{form.location}</p></div>}
            </div>
          </div>
        )}

        {/* Line items table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontFamily: 'sans-serif' }}>
          <thead>
            <tr style={{ background: '#1A1814' }}>
              {['Description', 'Qty', 'Rate', 'Amount'].map((h, i) => (
                <th key={h} style={{ padding: '8px 12px', textAlign: i === 0 ? 'left' : 'right', color: '#B8962E', fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.filter(i => i.description).map((item, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #EEE', background: i % 2 === 0 ? '#FAFAFA' : 'white' }}>
                <td style={{ padding: '9px 12px', fontSize: '12px', color: '#333' }}>{item.description}</td>
                <td style={{ padding: '9px 12px', fontSize: '12px', textAlign: 'right', color: '#666' }}>{item.qty}</td>
                <td style={{ padding: '9px 12px', fontSize: '12px', textAlign: 'right', color: '#666' }}>£{item.rate.toFixed(2)}</td>
                <td style={{ padding: '9px 12px', fontSize: '12px', textAlign: 'right', fontWeight: 600, color: '#1A1814' }}>£{(item.qty * item.rate).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '28px' }}>
          <div style={{ width: '240px', background: '#1A1814', padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ color: '#B8962E', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0, fontFamily: 'sans-serif' }}>Total Due</p>
              <p style={{ color: 'white', fontSize: '22px', fontWeight: 300, margin: 0, fontFamily: 'sans-serif' }}>£{total.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Payment & QR */}
        <div style={{ display: 'grid', gridTemplateColumns: hasBankDetails ? '1fr auto' : '1fr', gap: '24px', marginBottom: '24px' }}>
          <div>
            <p style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#888', margin: '0 0 10px', fontFamily: 'sans-serif' }}>Payment Details</p>
            {hasBankDetails ? (
              <div style={{ border: '1px solid #E8D9A8', background: '#F9F3E3', padding: '14px 16px', fontFamily: 'sans-serif' }}>
                {[
                  ['Account Name', bank.accountName],
                  ['Bank', bank.bankName || '—'],
                  ['Sort Code', bank.sortCode],
                  ['Account Number', bank.accountNo],
                  ['Reference', bank.reference || invoiceNo],
                ].map(([k, v]) => v && v !== '—' && (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #E8D9A8' }}>
                    <span style={{ fontSize: '10px', color: '#888' }}>{k}</span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#1A1814' }}>{v}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '11px', color: '#888', fontFamily: 'sans-serif' }}>Bank transfer details will be provided separately.</p>
            )}
            {form.notes && (
              <div style={{ marginTop: '14px' }}>
                <p style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#888', margin: '0 0 6px', fontFamily: 'sans-serif' }}>Notes</p>
                <p style={{ fontSize: '11px', color: '#555', margin: 0, fontFamily: 'sans-serif', whiteSpace: 'pre-line' }}>{form.notes}</p>
              </div>
            )}
          </div>
          {hasBankDetails && bankQrText && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ background: 'white', padding: '8px', border: '1px solid #E8D9A8' }}>
                <QRCodeSVG value={bankQrText} size={100} />
              </div>
              <p style={{ fontSize: '9px', color: '#888', textAlign: 'center', margin: 0, fontFamily: 'sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Scan to Pay</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: '#1A1814', padding: '14px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ color: '#B8962E', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0, fontFamily: 'sans-serif' }}>Visual by Sherif</p>
        <p style={{ color: '#555', fontSize: '9px', margin: 0, fontFamily: 'sans-serif' }}>Thank you for your business · {invoiceNo}</p>
      </div>
      <div style={{ height: '3px', background: 'linear-gradient(to right,#B8962E,#E8C96A,#B8962E)' }} />
    </div>
  )
}
