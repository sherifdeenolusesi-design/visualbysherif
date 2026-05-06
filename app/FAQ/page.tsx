import FAQAccordion from '@/components/FAQ/FAQAccordion'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQ — Visual by Sherif',
  description: 'Answers to common questions about booking, pricing, deliverables, the conference room, prints, and child safety.',
}

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-zinc-950 pt-16">
      <div className="max-w-5xl mx-auto px-4 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-zinc-400 uppercase tracking-[0.5em] text-sm mb-5">
            Support
          </p>
          <h1 className="text-5xl md:text-6xl font-thin text-white mb-6 tracking-wide">
            FAQ
          </h1>
          <p className="text-white text-base max-w-md mx-auto leading-relaxed">
            Everything you need to know about working with Visual by Sherif — from
            first enquiry to final delivery.
          </p>
        </div>

        <FAQAccordion />
      </div>
    </div>
  )
}
