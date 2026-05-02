'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function GalleryIndexPage() {
  const [slug, setSlug] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (slug.trim()) {
      router.push(`/gallery/${slug.trim().toLowerCase().replace(/\s+/g, '-')}`)
    }
  }

  return (
    <div className="min-h-screen pt-16 flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <p className="text-zinc-600 uppercase tracking-[0.4em] text-xs mb-6">Client Access</p>
        <h1 className="text-3xl font-thin text-white mb-3">Your Gallery</h1>
        <p className="text-zinc-500 text-sm mb-10 leading-relaxed">
          Enter the gallery name provided by your photographer.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="e.g. smith-wedding-2024"
            className="w-full bg-zinc-900 border border-zinc-800 text-white px-4 py-3.5 text-center focus:outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-700"
            required
          />
          <button
            type="submit"
            className="w-full bg-white text-zinc-950 py-3.5 text-xs uppercase tracking-[0.2em] hover:bg-zinc-100 transition-colors"
          >
            Find My Gallery
          </button>
        </form>

        <p className="text-zinc-700 text-xs mt-8">
          Don't have a gallery name?{' '}
          <a href="/contact" className="text-zinc-500 hover:text-white transition-colors">
            Contact the photographer
          </a>
        </p>
      </div>
    </div>
  )
}
