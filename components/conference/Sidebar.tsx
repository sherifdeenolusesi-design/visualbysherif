'use client'

import { useState, useEffect, useRef } from 'react'
import type { SessionPhoto, PhotoSelection } from '@/types/conference'

interface Message {
  id: string
  sender: string
  role: string
  text: string
  sent_at: string
}

interface Props {
  photos: SessionPhoto[]
  selections: Record<string, PhotoSelection>
  selectedPhotos: SessionPhoto[]
  activePhotoId: string | null
  onPhotoActivate: (photoId: string) => void
  onToggleFavourite: (photoId: string) => void
  onUpdateComment: (photoId: string, comment: string) => void
  onDeselect: (photoId: string) => void
  onSendMessage: (text: string) => void
  messages: Message[]
  sessionId: string
  role: 'photographer' | 'client'
  userName: string
}

export default function Sidebar({
  photos,
  selections,
  selectedPhotos,
  activePhotoId,
  onPhotoActivate,
  onToggleFavourite,
  onUpdateComment,
  onDeselect,
  onSendMessage,
  messages,
  sessionId,
  role,
  userName,
}: Props) {
  const [tab, setTab] = useState<'selected' | 'detail' | 'chat'>('selected')
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [prevMsgCount, setPrevMsgCount] = useState(0)
  const [unread, setUnread] = useState(0)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const activePhoto = activePhotoId ? photos.find((p) => p.id === activePhotoId) : null
  const activeSelection = activePhotoId ? selections[activePhotoId] : null

  useEffect(() => {
    setComment(activeSelection?.comment ?? '')
  }, [activePhotoId, activeSelection?.comment])

  // Auto-scroll chat + track unread
  useEffect(() => {
    if (tab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      setUnread(0)
      setPrevMsgCount(messages.length)
    } else if (messages.length > prevMsgCount) {
      setUnread(messages.length - prevMsgCount)
    }
  }, [messages, tab])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return
    onSendMessage(chatInput.trim())
    setChatInput('')
  }

  const handleSaveComment = async () => {
    if (!activePhotoId) return
    setSaving(true)
    await onUpdateComment(activePhotoId, comment)
    setSaving(false)
  }

  const handleExportCSV = () => {
    const header = 'Filename,Selected By,Favourite,Comment'
    const rows = selectedPhotos.map((p) => {
      const sel = selections[p.id]
      return [`"${p.filename || p.id}"`, sel?.selected_by || '', sel?.is_favourite ? 'Yes' : 'No', `"${(sel?.comment || '').replace(/"/g, '""')}"`].join(',')
    })
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `selection-${sessionId.slice(0, 8)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <aside className="w-64 lg:w-72 border-l border-zinc-900 flex flex-col bg-zinc-950 flex-shrink-0">
      {/* Tabs */}
      <div className="flex border-b border-zinc-900 flex-shrink-0">
        {(['selected', 'detail', 'chat'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); if (t === 'chat') setUnread(0) }}
            className={`flex-1 py-3 text-[11px] uppercase tracking-widest transition-colors border-b-2 relative ${
              tab === t ? 'text-white border-white' : 'text-zinc-600 border-transparent hover:text-zinc-400'
            }`}
          >
            {t === 'selected' && selectedPhotos.length > 0 ? `Selected (${selectedPhotos.length})` :
             t === 'chat' ? 'Chat' : t.charAt(0).toUpperCase() + t.slice(1)}
            {t === 'chat' && unread > 0 && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-amber-400 text-zinc-950 text-[9px] rounded-full flex items-center justify-center font-bold">
                {unread}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* ── Selected tab ── */}
        {tab === 'selected' && (
          <>
            {selectedPhotos.length === 0 ? (
              <div className="p-6 text-center mt-4">
                <p className="text-zinc-700 text-xs">No photos selected yet.</p>
                <p className="text-zinc-800 text-xs mt-2 leading-relaxed">Click any photo in the grid to select it.</p>
              </div>
            ) : (
              <>
                <div className="px-3 pt-3 pb-1 flex items-center justify-between">
                  <p className="text-zinc-600 text-[10px] uppercase tracking-widest">{selectedPhotos.length} selected</p>
                  <p className="text-zinc-700 text-[10px]">× to deselect</p>
                </div>
                <div className="p-3 grid grid-cols-2 gap-1.5">
                  {selectedPhotos.map((photo) => {
                    const sel = selections[photo.id]
                    return (
                      <div key={photo.id} className={`relative aspect-square overflow-hidden bg-zinc-900 ring-1 transition-all ${activePhotoId === photo.id ? 'ring-amber-400' : 'ring-amber-400/30'}`}>
                        <div onClick={() => { onPhotoActivate(photo.id); setTab('detail') }} className="absolute inset-0 cursor-pointer group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photo.photo_url} alt={photo.filename || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                        <button
                          onClick={() => onDeselect(photo.id)}
                          className="absolute top-1 left-1 z-10 w-5 h-5 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center text-[11px] transition-colors"
                        >×</button>
                        {sel?.is_favourite && <span className="absolute top-1 right-1 text-red-400 text-xs drop-shadow pointer-events-none">♥</span>}
                        {sel?.comment && <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1 rounded pointer-events-none">💬</span>}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </>
        )}

        {/* ── Detail tab ── */}
        {tab === 'detail' && (
          <div className="p-4 space-y-4">
            {!activePhoto ? (
              <p className="text-zinc-700 text-xs text-center py-8">Click a photo in the grid to see its details.</p>
            ) : (
              <>
                <div className="relative overflow-hidden bg-zinc-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={activePhoto.photo_url} alt={activePhoto.filename || ''} className="w-full h-auto block max-h-48 object-contain" />
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-zinc-400 text-xs truncate font-light">{activePhoto.filename || 'Untitled'}</p>
                    {activeSelection ? (
                      <p className="text-zinc-600 text-xs mt-0.5">Selected by <span className="text-zinc-400">{activeSelection.selected_by}</span></p>
                    ) : (
                      <p className="text-zinc-700 text-xs mt-0.5">Not selected</p>
                    )}
                  </div>
                  {activeSelection && (
                    <button
                      onClick={() => onDeselect(activePhoto.id)}
                      className="flex-shrink-0 flex items-center gap-1 text-[11px] uppercase tracking-widest text-zinc-600 hover:text-red-400 border border-zinc-800 hover:border-red-900 px-2 py-1.5 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      Undo
                    </button>
                  )}
                </div>
                {activeSelection && (
                  <button
                    onClick={() => onToggleFavourite(activePhoto.id)}
                    className={`flex items-center gap-2 text-xs transition-colors ${activeSelection.is_favourite ? 'text-red-400' : 'text-zinc-600 hover:text-red-400'}`}
                  >
                    <span className="text-base leading-none">{activeSelection.is_favourite ? '♥' : '♡'}</span>
                    {activeSelection.is_favourite ? 'Remove favourite' : 'Mark as favourite'}
                  </button>
                )}
                {role === 'photographer' && activeSelection && (
                  <div>
                    <label className="block text-zinc-600 text-[11px] uppercase tracking-widest mb-2">Note</label>
                    <textarea
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add a note..."
                      className="w-full bg-zinc-900 border border-zinc-800 text-white px-3 py-2.5 text-xs focus:outline-none focus:border-zinc-600 resize-none placeholder:text-zinc-700 leading-relaxed"
                    />
                    <button
                      onClick={handleSaveComment}
                      disabled={saving}
                      className="mt-2 w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white py-2 text-[11px] uppercase tracking-widest transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Note'}
                    </button>
                  </div>
                )}
                {role === 'client' && activeSelection?.comment && (
                  <div>
                    <p className="text-zinc-600 text-[11px] uppercase tracking-widest mb-2">Photographer's Note</p>
                    <p className="text-zinc-400 text-xs leading-relaxed bg-zinc-900 border border-zinc-800 p-3">{activeSelection.comment}</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Chat tab ── */}
        {tab === 'chat' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
              {messages.length === 0 ? (
                <div className="text-center pt-8">
                  <p className="text-zinc-700 text-xs">No messages yet.</p>
                  <p className="text-zinc-800 text-xs mt-1">Start the conversation below.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender === userName && msg.role === role
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {!isMe && (
                        <p className="text-zinc-600 text-[10px] mb-1 px-1">{msg.sender}</p>
                      )}
                      <div className={`max-w-[85%] px-3 py-2 text-xs leading-relaxed ${
                        isMe
                          ? 'bg-white text-zinc-950'
                          : msg.role === 'photographer'
                          ? 'bg-zinc-800 text-zinc-200'
                          : 'bg-zinc-800 text-zinc-200'
                      }`}>
                        {msg.text}
                      </div>
                      <p className="text-zinc-700 text-[9px] mt-0.5 px-1">{formatTime(msg.sent_at)}</p>
                    </div>
                  )
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat input */}
            <form onSubmit={handleSendMessage} className="border-t border-zinc-900 p-3 flex gap-2 flex-shrink-0">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Message..."
                className="flex-1 bg-zinc-900 border border-zinc-800 text-white px-3 py-2 text-xs focus:outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-700"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="bg-white text-zinc-950 px-3 py-2 text-xs hover:bg-zinc-100 transition-colors disabled:opacity-40"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Export bar */}
      {tab !== 'chat' && role === 'photographer' && selectedPhotos.length > 0 && (
        <div className="border-t border-zinc-900 p-3 space-y-2 flex-shrink-0">
          <button onClick={handleExportCSV} className="w-full border border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-white py-2.5 text-[11px] uppercase tracking-widest transition-colors">
            ↓ Export CSV
          </button>
          <button onClick={() => window.print()} className="w-full border border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-white py-2.5 text-[11px] uppercase tracking-widest transition-colors">
            ⎙ Print Summary
          </button>
        </div>
      )}
    </aside>
  )
}
