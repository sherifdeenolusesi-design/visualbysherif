'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import PresenceBar from './PresenceBar'
import PhotoGrid from './PhotoGrid'
import Sidebar from './Sidebar'
import PhotographerControls from './PhotographerControls'
import type { ConferenceSession, SessionPhoto, PhotoSelection, PresenceUser } from '@/types/conference'

interface Message {
  id: string
  sender: string
  role: string
  text: string
  sent_at: string
}

interface Props {
  session: ConferenceSession
  photos: SessionPhoto[]
  initialSelections: PhotoSelection[]
  role: 'photographer' | 'client'
  userName: string
}

export default function ConferenceRoom({
  session: initialSession,
  photos: initialPhotos,
  initialSelections,
  role,
  userName,
}: Props) {
  const [session, setSession] = useState(initialSession)
  const [photos, setPhotos] = useState(initialPhotos)
  const [selections, setSelections] = useState<Record<string, PhotoSelection>>(
    Object.fromEntries(initialSelections.map((s) => [s.photo_id, s]))
  )
  const [presence, setPresence] = useState<PresenceUser[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])

  const supabase = createClient()
  const userId = useRef(`${role}-${Math.random().toString(36).slice(2, 9)}`)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const lastMessageId = useRef<string>('')

  // ── Bidirectional polling: photos for BOTH roles ──
  useEffect(() => {
    const pollPhotos = async () => {
      const res = await fetch(`/api/conference/photos?session_id=${session.id}`)
      if (!res.ok) return
      const { photos: fresh } = await res.json()
      setPhotos((prev) => {
        if (JSON.stringify(prev.map(p => p.id)) === JSON.stringify(fresh.map((p: SessionPhoto) => p.id))) return prev
        return fresh
      })
    }
    pollPhotos()
    const interval = setInterval(pollPhotos, 4000)
    return () => clearInterval(interval)
  }, [session.id])

  // ── Chat polling every 2 seconds ──
  useEffect(() => {
    const pollChat = async () => {
      const res = await fetch(`/api/conference/chat?session_id=${session.id}`)
      if (!res.ok) return
      const { messages: fresh } = await res.json()
      if (!fresh.length) return
      const latestId = fresh[fresh.length - 1].id
      if (latestId !== lastMessageId.current) {
        lastMessageId.current = latestId
        setMessages(fresh)
      }
    }
    pollChat()
    const interval = setInterval(pollChat, 2000)
    return () => clearInterval(interval)
  }, [session.id])

  // ── Supabase Realtime (selections + presence) ──
  useEffect(() => {
    const channel = supabase.channel(`conference:${session.id}`, {
      config: { presence: { key: userId.current } },
    })

    channel
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'photo_selections', filter: `session_id=eq.${session.id}` },
        ({ new: sel }) => {
          const s = sel as PhotoSelection
          setSelections((prev) => ({ ...prev, [s.photo_id]: s }))
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'photo_selections', filter: `session_id=eq.${session.id}` },
        ({ new: sel }) => {
          const s = sel as PhotoSelection
          setSelections((prev) => ({ ...prev, [s.photo_id]: s }))
        }
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'photo_selections', filter: `session_id=eq.${session.id}` },
        ({ old: sel }) => {
          const s = sel as PhotoSelection
          setSelections((prev) => { const next = { ...prev }; delete next[s.photo_id]; return next })
        }
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'session_photos', filter: `session_id=eq.${session.id}` },
        ({ new: photo }) => {
          const p = photo as SessionPhoto
          setPhotos((prev) => prev.find(x => x.id === p.id) ? prev : [...prev, p])
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conference_sessions', filter: `id=eq.${session.id}` },
        ({ new: updated }) => setSession(updated as ConferenceSession)
      )
      .on('presence', { event: 'sync' }, () => {
        setPresence(Object.values(channel.presenceState<PresenceUser>()).flat())
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: userId.current, role, name: userName, online_at: new Date().toISOString() })
        }
      })

    channelRef.current = channel
    return () => { channel.unsubscribe() }
  }, [session.id, role, userName])

  const toggleSelection = async (photoId: string) => {
    if (session.status === 'locked' && role === 'client') return
    if (selections[photoId]) {
      await supabase.from('photo_selections').delete().eq('session_id', session.id).eq('photo_id', photoId)
      setSelections((prev) => { const next = { ...prev }; delete next[photoId]; return next })
    } else {
      const { data } = await supabase.from('photo_selections').upsert(
        { session_id: session.id, photo_id: photoId, selected_by: role, is_favourite: false, comment: null },
        { onConflict: 'session_id,photo_id' }
      ).select().single()
      if (data) setSelections((prev) => ({ ...prev, [photoId]: data as PhotoSelection }))
    }
  }

  const toggleFavourite = async (photoId: string) => {
    const sel = selections[photoId]
    if (!sel) return
    const { data } = await supabase.from('photo_selections')
      .update({ is_favourite: !sel.is_favourite })
      .eq('session_id', session.id).eq('photo_id', photoId)
      .select().single()
    if (data) setSelections((prev) => ({ ...prev, [photoId]: data as PhotoSelection }))
  }

  const updateComment = async (photoId: string, comment: string) => {
    const { data } = await supabase.from('photo_selections')
      .update({ comment })
      .eq('session_id', session.id).eq('photo_id', photoId)
      .select().single()
    if (data) setSelections((prev) => ({ ...prev, [photoId]: data as PhotoSelection }))
  }

  const lockSession = async () => {
    const newStatus = session.status === 'locked' ? 'active' : 'locked'
    await supabase.from('conference_sessions').update({ status: newStatus }).eq('id', session.id)
    setSession((prev) => ({ ...prev, status: newStatus }))
  }

  const approveSession = async () => {
    await supabase.from('conference_sessions').update({ status: 'completed' }).eq('id', session.id)
    setSession((prev) => ({ ...prev, status: 'completed' }))
  }

  const clearPhotos = async () => {
    await fetch(`/api/conference/clear?session_id=${session.id}`, { method: 'DELETE' })
    setPhotos([])
    setSelections({})
  }

  const uploadPhotos = async (files: FileList) => {
    setUploading(true)
    const formData = new FormData()
    formData.append('session_id', session.id)
    Array.from(files).forEach((f) => formData.append('files', f))

    const res = await fetch('/api/conference/upload', { method: 'POST', body: formData })
    const data = await res.json()

    if (res.ok && data.uploaded?.length) {
      setPhotos((prev) => {
        const ids = new Set(prev.map((p) => p.id))
        const fresh = (data.uploaded as SessionPhoto[]).filter((p) => !ids.has(p.id))
        return [...prev, ...fresh]
      })
    }
    setUploading(false)
  }

  const sendMessage = async (text: string) => {
    const res = await fetch('/api/conference/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: session.id, sender: userName, role, text }),
    })
    if (res.ok) {
      const { message } = await res.json()
      setMessages((prev) => [...prev, message])
      lastMessageId.current = message.id
    }
  }

  const hasBrokenPhotos = photos.some(p => p.photo_url.startsWith('blob:'))
  const selectedCount = Object.keys(selections).length
  const selectedPhotos = photos.filter((p) => selections[p.id])
  const isLocked = session.status === 'locked'
  const unreadCount = messages.length

  return (
    <div className="h-screen flex flex-col bg-zinc-950 overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-zinc-900 flex items-center justify-between px-4 flex-shrink-0 z-10 bg-zinc-950/95 backdrop-blur-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <h1 className="text-white text-sm font-light truncate max-w-[200px] md:max-w-xs">{session.session_name}</h1>
            <p className="text-zinc-700 text-xs capitalize">{session.status}</p>
          </div>
          {isLocked && (
            <span className="hidden sm:block bg-amber-500/10 text-amber-400 text-[10px] px-2 py-0.5 border border-amber-500/20 uppercase tracking-widest flex-shrink-0">Locked</span>
          )}
          {session.status === 'completed' && (
            <span className="hidden sm:block bg-green-500/10 text-green-400 text-[10px] px-2 py-0.5 border border-green-500/20 uppercase tracking-widest flex-shrink-0">Approved</span>
          )}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <PresenceBar presence={presence} />
          <span className="text-zinc-600 text-xs hidden sm:block">
            <span className="text-white font-light">{selectedCount}</span>
            <span> / {photos.length}</span>
          </span>
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="text-zinc-600 hover:text-white transition-colors p-1"
            title="Toggle sidebar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Broken photo warning */}
      {hasBrokenPhotos && (
        <div className="bg-amber-950/40 border-b border-amber-900/50 px-4 py-2 flex items-center justify-between flex-shrink-0">
          <p className="text-amber-400 text-xs">⚠ Some photos have broken URLs. Clear and re-upload to fix.</p>
          {role === 'photographer' && (
            <button
              onClick={() => { if (confirm('Clear all photos and re-upload?')) clearPhotos() }}
              className="text-amber-400 border border-amber-800 px-3 py-1 text-[11px] uppercase tracking-widest hover:bg-amber-900/30 transition-colors"
            >
              Clear Now
            </button>
          )}
        </div>
      )}

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Photo area */}
        <div className="flex-1 overflow-y-auto">
          {photos.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-8 py-20">
              {role === 'photographer' ? (
                <>
                  <div className="w-16 h-16 rounded-full border border-zinc-800 flex items-center justify-center mb-5 text-zinc-700 text-2xl">↑</div>
                  <p className="text-zinc-400 text-sm mb-2">No photos yet</p>
                  <p className="text-zinc-700 text-xs">Use the controls below to upload photos to this session.</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full border border-zinc-800 flex items-center justify-center mb-5">
                    <span className="text-zinc-700 text-lg animate-pulse">•••</span>
                  </div>
                  <p className="text-zinc-400 text-sm mb-2">Waiting for photos</p>
                  <p className="text-zinc-700 text-xs">The photographer is preparing your gallery.</p>
                </>
              )}
            </div>
          ) : (
            <PhotoGrid
              photos={photos}
              selections={selections}
              onToggle={toggleSelection}
              onActivate={setActivePhotoId}
              activePhotoId={activePhotoId}
              locked={isLocked && role === 'client'}
            />
          )}
        </div>

        {/* Sidebar */}
        {sidebarOpen && (
          <Sidebar
            photos={photos}
            selections={selections}
            selectedPhotos={selectedPhotos}
            activePhotoId={activePhotoId}
            onPhotoActivate={setActivePhotoId}
            onToggleFavourite={toggleFavourite}
            onUpdateComment={updateComment}
            onDeselect={toggleSelection}
            onSendMessage={sendMessage}
            messages={messages}
            sessionId={session.id}
            role={role}
            userName={userName}
          />
        )}
      </div>

      {/* Photographer controls */}
      {role === 'photographer' && session.status !== 'completed' && (
        <PhotographerControls
          session={session}
          selectedCount={selectedCount}
          uploading={uploading}
          onUpload={uploadPhotos}
          onLock={lockSession}
          onApprove={approveSession}
          onClearPhotos={clearPhotos}
        />
      )}

      {session.status === 'completed' && (
        <div className="border-t border-green-900/50 bg-green-950/30 px-4 py-3 text-center flex-shrink-0">
          <p className="text-green-400 text-xs uppercase tracking-widest">
            ✓ Selection approved — {selectedCount} photos finalised
          </p>
        </div>
      )}
    </div>
  )
}
