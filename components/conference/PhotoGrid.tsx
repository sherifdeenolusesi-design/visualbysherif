'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { SessionPhoto, PhotoSelection } from '@/types/conference'

interface Props {
  photos: SessionPhoto[]
  selections: Record<string, PhotoSelection>
  onToggle: (photoId: string) => void
  onActivate: (photoId: string) => void
  activePhotoId: string | null
  locked: boolean
}

export default function PhotoGrid({ photos, selections, onToggle, onActivate, activePhotoId, locked }: Props) {
  return (
    <div className="p-3 columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-2">
      {photos.map((photo, i) => {
        const sel = selections[photo.id]
        const isSelected = !!sel
        const isActive = photo.id === activePhotoId

        return (
          <motion.div
            key={photo.id}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, delay: Math.min(i * 0.02, 0.5) }}
            className="break-inside-avoid mb-2"
          >
            <div
              onClick={() => {
                if (!locked) onToggle(photo.id)
                onActivate(photo.id)
              }}
              className={`relative overflow-hidden cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-zinc-950'
                  : isActive
                  ? 'ring-1 ring-zinc-600 ring-offset-1 ring-offset-zinc-950'
                  : ''
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.photo_url}
                alt={photo.filename || 'Photo'}
                className={`w-full h-auto block select-none transition-all duration-200 ${
                  isSelected ? 'brightness-[0.85]' : ''
                }`}
                draggable={false}
                onError={(e) => {
                  const t = e.currentTarget
                  t.style.display = 'none'
                  const parent = t.parentElement
                  if (parent && !parent.querySelector('.img-error')) {
                    const div = document.createElement('div')
                    div.className = 'img-error w-full aspect-square bg-zinc-800 flex items-center justify-center text-zinc-600 text-xs'
                    div.textContent = photo.filename ?? 'Image unavailable'
                    parent.appendChild(div)
                  }
                }}
              />

              {/* Selected overlay */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="absolute inset-0 bg-amber-400/5 pointer-events-none"
                  >
                    {/* Checkmark badge */}
                    <div className="absolute top-2 right-2 bg-amber-400 rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                      <svg className="w-3.5 h-3.5 text-zinc-950" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>

                    {/* Bottom indicators */}
                    <div className="absolute bottom-2 left-2 flex gap-1.5">
                      {sel.is_favourite && (
                        <span className="text-red-400 text-sm drop-shadow">♥</span>
                      )}
                      {sel.comment && (
                        <span className="bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                          💬
                        </span>
                      )}
                    </div>

                    {/* Who selected */}
                    <div className="absolute bottom-2 right-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        sel.selected_by === 'photographer'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {sel.selected_by === 'photographer' ? 'P' : 'C'}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Hover hint when not selected */}
              {!isSelected && !locked && (
                <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all duration-150 flex items-center justify-center group">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <div className="w-9 h-9 rounded-full border-2 border-white/50 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {/* Locked overlay */}
              {locked && !isSelected && (
                <div className="absolute inset-0 bg-black/20 pointer-events-none" />
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
