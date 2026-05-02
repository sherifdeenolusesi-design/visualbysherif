'use client'

import { useRef, useState } from 'react'
import type { ConferenceSession } from '@/types/conference'

interface Props {
  session: ConferenceSession
  selectedCount: number
  uploading: boolean
  onUpload: (files: FileList) => void
  onLock: () => void
  onApprove: () => void
  onClearPhotos: () => void
}

export default function PhotographerControls({
  session,
  selectedCount,
  uploading,
  onUpload,
  onLock,
  onApprove,
  onClearPhotos,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [copied, setCopied] = useState(false)

  const clientLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/conference/${session.id}?role=client&name=${encodeURIComponent(session.client_name || 'Client')}`
      : ''

  const copyClientLink = async () => {
    try {
      await navigator.clipboard.writeText(clientLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      prompt('Copy this link and send to your client:', clientLink)
    }
  }

  const isLocked = session.status === 'locked'

  return (
    <div className="border-t border-zinc-900 bg-zinc-950 px-4 py-3 flex items-center gap-2 flex-wrap flex-shrink-0">
      <input
        ref={fileRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files && onUpload(e.target.files)}
      />

      {/* Upload */}
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading || isLocked}
        className="flex items-center gap-2 bg-white text-zinc-950 px-4 py-2 text-[11px] uppercase tracking-widest hover:bg-zinc-100 transition-colors disabled:opacity-40"
      >
        {uploading ? (
          <>
            <span className="w-3 h-3 border border-zinc-600 border-t-transparent rounded-full animate-spin" />
            Uploading…
          </>
        ) : (
          '↑ Upload Photos'
        )}
      </button>

      {/* Copy client link */}
      <button
        onClick={copyClientLink}
        className="border border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-white px-4 py-2 text-[11px] uppercase tracking-widest transition-colors"
      >
        {copied ? '✓ Copied!' : '⎘ Client Link'}
      </button>

      {/* Lock / Unlock */}
      <button
        onClick={onLock}
        className={`border px-4 py-2 text-[11px] uppercase tracking-widest transition-colors ${
          isLocked
            ? 'border-amber-500/40 text-amber-400 hover:border-amber-400'
            : 'border-zinc-800 text-zinc-500 hover:border-amber-500/60 hover:text-amber-400'
        }`}
      >
        {isLocked ? '🔓 Unlock' : '🔒 Lock'}
      </button>

      {/* Approve */}
      {selectedCount > 0 && (
        <button
          onClick={onApprove}
          className="ml-auto border border-green-800/60 text-green-400 hover:border-green-500 px-4 py-2 text-[11px] uppercase tracking-widest transition-colors"
        >
          ✓ Approve {selectedCount} Photo{selectedCount !== 1 ? 's' : ''}
        </button>
      )}

      {/* Clear all photos */}
      <button
        onClick={() => {
          if (confirm('Clear all photos and selections from this session? This cannot be undone.')) {
            onClearPhotos()
          }
        }}
        disabled={isLocked}
        className="border border-zinc-800 text-zinc-700 hover:border-red-900 hover:text-red-500 px-4 py-2 text-[11px] uppercase tracking-widest transition-colors disabled:opacity-40"
      >
        ✕ Clear Photos
      </button>

      {/* Status hint */}
      {isLocked && (
        <p className="text-amber-600 text-[10px] w-full sm:w-auto sm:ml-2">
          Selections are locked — client cannot make changes.
        </p>
      )}
    </div>
  )
}
