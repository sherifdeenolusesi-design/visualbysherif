'use client'

import { useState } from 'react'
import PhotoGrid from './PhotoGrid'
import type { ClientGallery, ClientGalleryPhoto } from '@/types'

interface Props {
  gallery: ClientGallery
}

export default function GalleryUnlock({ gallery }: Props) {
  const [password, setPassword] = useState('')
  const [photos, setPhotos] = useState<ClientGalleryPhoto[]>([])
  const [unlocked, setUnlocked] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/gallery/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: gallery.slug, password }),
    })

    const data = await res.json()

    if (res.ok) {
      setPhotos(data.photos)
      setUnlocked(true)
    } else {
      setError(data.error || 'Incorrect password')
    }

    setLoading(false)
  }

  if (unlocked) {
    return <PhotoGrid gallery={gallery} photos={photos} />
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-sm">
        <p className="text-zinc-600 uppercase tracking-[0.4em] text-xs text-center mb-6">
          Private Gallery
        </p>
        <h1 className="text-2xl font-thin text-white text-center mb-2">{gallery.name}</h1>
        <p className="text-zinc-500 text-sm text-center mb-10">
          {gallery.description || 'Enter the password to access your photos.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Gallery password"
            className="w-full bg-zinc-900 border border-zinc-800 text-white px-4 py-3.5 text-center focus:outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-700"
            required
            autoFocus
          />
          {error && <p className="text-red-400 text-xs text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-zinc-950 py-3.5 text-xs uppercase tracking-[0.2em] hover:bg-zinc-100 transition-colors disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Access Gallery'}
          </button>
        </form>

        <p className="text-zinc-700 text-xs text-center mt-8">
          Don't have the password?{' '}
          <a href="/contact" className="text-zinc-500 hover:text-white transition-colors">
            Contact the photographer
          </a>
        </p>
      </div>
    </div>
  )
}
