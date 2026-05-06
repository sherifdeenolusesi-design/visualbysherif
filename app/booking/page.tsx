import BookingForm from '@/components/booking/BookingForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Book a Session',
  description: 'Book a photography session — portraits, events, and more.',
}

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

export default function BookingPage() {
  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-2xl mx-auto px-4 py-20">
        <p className="text-zinc-400 uppercase tracking-[0.4em] text-xs text-center mb-6">
          Let's Work Together
        </p>
        <h1 className="text-4xl font-thin text-white text-center mb-4">Book a Session</h1>
        <p className="text-white text-base text-center mb-14">
          Fill out the form and I'll get back to you within 24 hours to confirm your booking.
        </p>
        <BookingForm sessionTypes={SESSION_TYPES} />
      </div>
    </div>
  )
}
