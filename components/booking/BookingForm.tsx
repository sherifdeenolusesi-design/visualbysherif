'use client'

import { useState } from 'react'

interface Props {
  sessionTypes: string[]
}

const inputClass =
  'w-full bg-zinc-900 border border-zinc-800 text-white px-4 py-3.5 focus:outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-600 text-base'

export default function BookingForm({ sessionTypes }: Props) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    session_type: '',
    preferred_date: '',
    message: '',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    const res = await fetch('/api/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      setStatus('success')
    } else {
      const data = await res.json()
      setErrorMsg(data.error || 'Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-6 text-white">
          ✓
        </div>
        <h2 className="text-2xl font-thin text-white mb-3">Request Received!</h2>
        <p className="text-white text-base leading-relaxed">
          Thank you for reaching out. I'll be in touch within 24 hours to confirm your session.
        </p>
      </div>
    )
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-white text-sm uppercase tracking-widest mb-2">
            Full Name *
          </label>
          <input
            type="text"
            name="name"
            required
            value={form.name}
            onChange={handleChange}
            className={inputClass}
            placeholder="Jane Smith"
          />
        </div>
        <div>
          <label className="block text-white text-sm uppercase tracking-widest mb-2">
            Email *
          </label>
          <input
            type="email"
            name="email"
            required
            value={form.email}
            onChange={handleChange}
            className={inputClass}
            placeholder="jane@example.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-white text-sm uppercase tracking-widest mb-2">
            Phone
          </label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className={inputClass}
            placeholder="+1 (555) 000-0000"
          />
        </div>
        <div>
          <label className="block text-white text-sm uppercase tracking-widest mb-2">
            Session Type *
          </label>
          <select
            name="session_type"
            required
            value={form.session_type}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="">Select type...</option>
            {sessionTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-white text-sm uppercase tracking-widest mb-2">
          Preferred Date *
        </label>
        <input
          type="date"
          name="preferred_date"
          required
          value={form.preferred_date}
          onChange={handleChange}
          min={today}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-white text-sm uppercase tracking-widest mb-2">
          Tell Me More
        </label>
        <textarea
          name="message"
          rows={5}
          value={form.message}
          onChange={handleChange}
          className={inputClass}
          placeholder="Location ideas, style preferences, number of people, any special requests..."
        />
      </div>

      {status === 'error' && (
        <p className="text-red-400 text-xs">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full bg-white text-zinc-950 py-4 text-sm uppercase tracking-[0.2em] hover:bg-zinc-100 transition-colors disabled:opacity-50"
      >
        {status === 'loading' ? 'Sending...' : 'Request Booking'}
      </button>

      <p className="text-zinc-400 text-sm text-center">* Required fields</p>
    </form>
  )
}
