'use client'

import { useState } from 'react'
import Image from 'next/image'
import Lightbox from './Lightbox'
import type { Photo } from '@/types'

interface Props {
  photos: Photo[]
}

export default function MasonryGrid({ photos }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (photos.length === 0) {
    return (
      <div className="text-center py-28 text-zinc-700 text-sm">
        No photos in this category yet.
      </div>
    )
  }

  return (
    <>
      <div className="masonry-grid">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="masonry-item relative overflow-hidden cursor-pointer group bg-zinc-900"
            onClick={() => setLightboxIndex(index)}
          >
            <Image
              src={photo.url}
              alt={photo.title}
              width={photo.width || 800}
              height={photo.height || 600}
              className="w-full h-auto block transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-end">
              <div className="p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                <p className="text-white text-sm font-light">{photo.title}</p>
                {photo.description && (
                  <p className="text-zinc-400 text-xs mt-1">{photo.description}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  )
}
