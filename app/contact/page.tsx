import ContactForm from '@/components/contact/ContactForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch for bookings, collaborations, or questions.',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-5xl mx-auto px-4 py-20">
        <p className="text-zinc-600 uppercase tracking-[0.4em] text-xs text-center mb-6">
          Say Hello
        </p>
        <h1 className="text-4xl font-thin text-white text-center mb-4">Get in Touch</h1>
        <p className="text-zinc-500 text-sm text-center mb-20">
          For bookings, collaborations, or just to say hello.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
          {/* Info */}
          <div className="space-y-10">
            <div>
              <h3 className="text-zinc-600 text-xs uppercase tracking-widest mb-3">Email</h3>
              <a
                href="mailto:Virtualsbysherif@gmail.com"
                className="text-white text-sm hover:text-zinc-300 transition-colors"
              >
                Virtualsbysherif@gmail.com
              </a>
            </div>
            <div>
              <h3 className="text-zinc-600 text-xs uppercase tracking-widest mb-3">Based in</h3>
              <p className="text-white text-sm">Birmingham, West Midlands</p>
            </div>
            <div>
              <h3 className="text-zinc-600 text-xs uppercase tracking-widest mb-3">Follow</h3>
              <div className="space-y-2.5">
                <a
                  href="https://instagram.com/virtualsbysherif"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-zinc-400 text-sm hover:text-white transition-colors group"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  @virtualsbysherif ↗
                </a>
                <a
                  href="https://tiktok.com/@virtualsbysherif"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-zinc-400 text-sm hover:text-white transition-colors group"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
                  </svg>
                  @virtualsbysherif ↗
                </a>
                <a
                  href="https://facebook.com/virtualsbysherif"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-zinc-400 text-sm hover:text-white transition-colors group"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  @virtualsbysherif ↗
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-zinc-600 text-xs uppercase tracking-widest mb-3">
                Response Time
              </h3>
              <p className="text-zinc-500 text-sm leading-relaxed">
                I typically respond within 24 hours on business days.
              </p>
            </div>
          </div>

          {/* Form */}
          <ContactForm />
        </div>
      </div>
    </div>
  )
}
