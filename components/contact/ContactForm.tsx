'use client'

import { useState } from 'react'

const inputClass =
  'w-full bg-zinc-900 border border-zinc-800 text-white px-4 py-3.5 focus:outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-600 text-base'

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    const res = await fetch('/api/contact', {
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
        <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-5 text-white text-sm">
          ✓
        </div>
        <h2 className="text-xl font-thin text-white mb-2">Message Sent</h2>
        <p className="text-white text-base">I'll be in touch soon.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-white text-sm uppercase tracking-widest mb-2">
          Name *
        </label>
        <input
          type="text"
          name="name"
          required
          value={form.name}
          onChange={handleChange}
          className={inputClass}
          placeholder="Your name"
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
          placeholder="your@email.com"
        />
      </div>
      <div>
        <label className="block text-white text-sm uppercase tracking-widest mb-2">
          Message *
        </label>
        <textarea
          name="message"
          required
          rows={6}
          value={form.message}
          onChange={handleChange}
          className={inputClass}
          placeholder="How can I help you?"
        />
      </div>

      {status === 'error' && <p className="text-red-400 text-xs">{errorMsg}</p>}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full bg-white text-zinc-950 py-4 text-sm uppercase tracking-[0.2em] hover:bg-zinc-100 transition-colors disabled:opacity-50"
      >
        {status === 'loading' ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  )
}
