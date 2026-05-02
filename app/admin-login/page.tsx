'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Suspense } from 'react'

function LoginForm() {
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const router      = useRouter()
  const searchParams = useSearchParams()
  const from        = searchParams.get('from') ?? '/sessions/contract'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res  = await fetch('/api/admin-auth', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Incorrect password.'); return }
      router.push(from)
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex justify-center mb-10">
          <div className="h-16 w-16">
            <img src="/logo/logo.png" alt="Visual by Sherif" className="h-full w-full object-contain" />
          </div>
        </div>

        <p className="text-zinc-600 text-xs uppercase tracking-widest text-center mb-2">Company Access</p>
        <h1 className="text-white text-2xl font-thin text-center mb-8">Enter Password</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 px-4 py-3 text-sm focus:outline-none focus:border-zinc-600"
          />

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-zinc-950 py-3 text-xs uppercase tracking-widest hover:bg-zinc-100 transition-colors disabled:opacity-50"
          >
            {loading ? 'Verifying…' : 'Access'}
          </button>
        </form>

        <p className="text-zinc-700 text-xs text-center mt-8">Restricted area · Visual by Sherif</p>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
