'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import type { Photo } from '@/types'

interface Props {
  photos: Photo[]
  initialIndex: number
  onClose: () => void
}

export default function Lightbox({ photos, initialIndex, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex)

  const goNext = useCallback(
    () => setIndex((i) => (i + 1) % photos.length),
    [photos.length]
  )
  const goPrev = useCallback(
    () => setIndex((i) => (i - 1 + photos.length) % photos.length),
    [photos.length]
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, goNext, goPrev])

  const photo = photos[index]

  return (
    <div
      className="fixed inset-0 z-50 bg-black/97 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 z-10 text-zinc-400 hover:text-white transition-colors text-2xl w-10 h-10 flex items-center justify-center"
        aria-label="Close"
      >
        ×
      </button>

      {/* Counter */}
      <span className="absolute top-5 left-5 z-10 text-zinc-600 text-xs tabular-nums">
        {index + 1} / {photos.length}
      </span>

      {/* Prev */}
      {photos.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); goPrev() }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-zinc-500 hover:text-white transition-colors text-3xl px-4 py-10"
          aria-label="Previous"
        >
          ‹
        </button>
      )}

      {/* Image */}
      <div
        className="relative max-w-5xl max-h-[88vh] w-full px-16 flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={photo.url}
          alt={photo.title}
          width={photo.width || 1400}
          height={photo.height || 900}
          className="max-h-[80vh] w-auto mx-auto object-contain"
          priority
        />
        {(photo.title || photo.description) && (
          <div className="mt-5 text-center">
            <p className="text-white font-light text-sm">{photo.title}</p>
            {photo.description && (
              <p className="text-zinc-500 text-xs mt-1">{photo.description}</p>
            )}
          </div>
        )}
      </div>

      {/* Next */}
      {photos.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); goNext() }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-zinc-500 hover:text-white transition-colors text-3xl px-4 py-10"
          aria-label="Next"
        >
          ›
        </button>
      )}
    </div>
  )
}
