'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BookingForm from './BookingForm'

const SESSION_TYPES = [
  'Portrait Session',
  'Family Session',
  'Engagement Session',
  'Wedding',
  'Event Coverage',
  'Commercial / Brand',
  'Headshots',
  'Other',
]

interface Props {
  open: boolean
  onClose: () => void
}

export default function BookingModal({ open, onClose }: Props) {
  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-zinc-950 border border-zinc-800 pointer-events-auto">
              {/* Header */}
              <div className="sticky top-0 z-10 bg-zinc-950 border-b border-zinc-900 px-8 py-5 flex items-center justify-between">
                <div>
                  <p className="text-zinc-600 uppercase tracking-[0.4em] text-xs mb-1">
                    Let's Work Together
                  </p>
                  <h2 className="text-xl font-thin text-white">Book a Session</h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-zinc-500 hover:text-white transition-colors p-1"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form */}
              <div className="px-8 py-8">
                <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
                  Fill out the form and I'll get back to you within 24 hours to confirm your booking.
                </p>
                <BookingForm sessionTypes={SESSION_TYPES} />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
