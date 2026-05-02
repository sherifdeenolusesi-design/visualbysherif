'use client'

import { useState } from 'react'
import Image from 'next/image'
import Lightbox from '@/components/portfolio/Lightbox'
import type { ClientGallery, ClientGalleryPhoto, Photo } from '@/types'

interface Props {
  gallery: ClientGallery
  photos: ClientGalleryPhoto[]
}

function toPhoto(p: ClientGalleryPhoto): Photo {
  return {
    id: p.id,
    title: p.filename,
    description: null,
    url: p.url,
    category: '',
    width: 1200,
    height: 800,
    order_index: 0,
    created_at: p.created_at,
  }
}

export default function PhotoGrid({ gallery, photos }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [downloading, setDownloading] = useState(false)

  const handleDownloadAll = async () => {
    setDownloading(true)
    for (const photo of photos) {
      try {
        const res = await fetch(photo.url)
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = photo.filename
        a.click()
        URL.revokeObjectURL(url)
        await new Promise((r) => setTimeout(r, 400))
      } catch {}
    }
    setDownloading(false)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-end justify-between mb-10">
        <div>
          <h1 className="text-3xl font-thin text-white">{gallery.name}</h1>
          <p className="text-zinc-600 text-xs mt-2 uppercase tracking-widest">
            {photos.length} photo{photos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={handleDownloadAll}
          disabled={downloading}
          className="bg-white text-zinc-950 px-6 py-2.5 text-xs uppercase tracking-widest hover:bg-zinc-100 transition-colors disabled:opacity-50"
        >
          {downloading ? 'Downloading...' : 'Download All'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="relative aspect-square overflow-hidden cursor-pointer group bg-zinc-900"
            onClick={() => setLightboxIndex(index)}
          >
            <Image
              src={photo.url}
              alt={photo.filename}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end justify-end p-2 gap-2">
              <a
                href={photo.url}
                download={photo.filename}
                onClick={(e) => e.stopPropagation()}
                className="opacity-0 group-hover:opacity-100 bg-white text-zinc-950 px-2.5 py-1.5 text-xs uppercase tracking-widest transition-opacity hover:bg-zinc-100"
              >
                Save
              </a>
            </div>
          </div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos.map(toPhoto)}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  )
}
