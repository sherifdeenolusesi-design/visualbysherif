'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface RecentSession {
  id: string
  name: string
  role: string
  userName: string
  joinedAt: string
}

const STORAGE_KEY = 'vbs_recent_sessions'

function saveRecentSession(session: RecentSession) {
  const existing: RecentSession[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  const filtered = existing.filter((s) => s.id !== session.id)
  const updated = [session, ...filtered].slice(0, 5)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}

function getRecentSessions(): RecentSession[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

export default function ConferencePage() {
  const [sessionName, setSessionName] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [photographerName, setPhotographerName] = useState('Sherif')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [rejoinInput, setRejoinInput] = useState('')
  const [rejoinError, setRejoinError] = useState('')
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([])

  const router = useRouter()

  useEffect(() => {
    setRecentSessions(getRecentSessions())
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/conference/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_name: sessionName, client_email: clientEmail, client_name: clientName }),
    })

    const data = await res.json()

    if (res.ok) {
      const session: RecentSession = {
        id: data.id,
        name: sessionName,
        role: 'photographer',
        userName: photographerName || 'Sherif',
        joinedAt: new Date().toISOString(),
      }
      saveRecentSession(session)
      router.push(`/conference/${data.id}?role=photographer&name=${encodeURIComponent(photographerName)}`)
    } else {
      setError(data.error || 'Failed to create session')
      setLoading(false)
    }
  }

  const handleRejoin = (e: React.FormEvent) => {
    e.preventDefault()
    setRejoinError('')
    const raw = rejoinInput.trim()
    if (!raw) return

    // Accept full URL or bare session ID
    let sessionId = raw
    try {
      const url = new URL(raw)
      const parts = url.pathname.split('/').filter(Boolean)
      const idx = parts.indexOf('conference')
      if (idx !== -1 && parts[idx + 1]) {
        sessionId = parts[idx + 1]
      }
    } catch {
      // Not a URL — treat as raw ID
    }

    if (!sessionId) {
      setRejoinError('Could not find a session ID in that link.')
      return
    }

    router.push(`/conference/${sessionId}?role=photographer&name=${encodeURIComponent(photographerName || 'Sherif')}`)
  }

  const rejoinRecent = (s: RecentSession) => {
    router.push(`/conference/${s.id}?role=${s.role}&name=${encodeURIComponent(s.userName)}`)
  }

  const removeRecent = (id: string) => {
    const updated = recentSessions.filter((s) => s.id !== id)
    setRecentSessions(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const inputClass =
    'w-full bg-zinc-900 border border-zinc-800 text-white px-4 py-3.5 focus:outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-700 text-sm'

  return (
    <div className="min-h-screen pt-16 px-4 py-16">
      <div className="max-w-md mx-auto space-y-10">

        {/* ── Reconnect: Recent Sessions ── */}
        {recentSessions.length > 0 && (
          <div>
            <p className="text-zinc-600 uppercase tracking-[0.4em] text-xs mb-4">
              Recent Sessions
            </p>
            <div className="space-y-2">
              {recentSessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 border border-zinc-800 px-4 py-3 bg-zinc-900/50 group"
                >
                  <div className="min-w-0">
                    <p className="text-white text-sm font-light truncate">{s.name}</p>
                    <p className="text-zinc-600 text-xs mt-0.5">
                      {new Date(s.joinedAt).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                      {' · '}
                      <span className="capitalize">{s.role}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => rejoinRecent(s)}
                      className="text-xs uppercase tracking-widest text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 transition-colors"
                    >
                      Rejoin →
                    </button>
                    <button
                      onClick={() => removeRecent(s.id)}
                      className="text-zinc-700 hover:text-zinc-400 transition-colors p-1"
                      aria-label="Remove"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Reconnect: Paste a link ── */}
        <div>
          <p className="text-zinc-600 uppercase tracking-[0.4em] text-xs mb-4">
            Rejoin via Link or Session ID
          </p>
          <form onSubmit={handleRejoin} className="flex gap-2">
            <input
              type="text"
              value={rejoinInput}
              onChange={(e) => setRejoinInput(e.target.value)}
              placeholder="Paste session link or ID..."
              className={`${inputClass} flex-1`}
            />
            <button
              type="submit"
              className="flex-shrink-0 bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-3.5 text-xs uppercase tracking-widest transition-colors"
            >
              Go →
            </button>
          </form>
          {rejoinError && <p className="text-red-400 text-xs mt-2">{rejoinError}</p>}
        </div>

        <div className="border-t border-zinc-900" />

        {/* ── Create New Session ── */}
        <div>
          <p className="text-zinc-600 uppercase tracking-[0.4em] text-xs mb-4">
            New Selection Session
          </p>
          <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
            Create a room and share the link with your client for collaborative photo selection.
          </p>

          <form onSubmit={handleCreate} className="space-y-5">
            <div>
              <label className="block text-zinc-600 text-xs uppercase tracking-widest mb-2">
                Session Name *
              </label>
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                required
                placeholder="e.g. Smith Wedding — Final Selection"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-zinc-600 text-xs uppercase tracking-widest mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={photographerName}
                onChange={(e) => setPhotographerName(e.target.value)}
                placeholder="Sherif"
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-600 text-xs uppercase tracking-widest mb-2">
                  Client Name
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Jane Smith"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-zinc-600 text-xs uppercase tracking-widest mb-2">
                  Client Email
                </label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="jane@..."
                  className={inputClass}
                />
              </div>
            </div>

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-zinc-950 py-4 text-xs uppercase tracking-[0.2em] hover:bg-zinc-100 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating Room...' : 'Create Session →'}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
