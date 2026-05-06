import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: {
    default: 'Visual by Sherif | Photography & Cinematography',
    template: '%s | Visual by Sherif',
  },
  description:
    'Visual by Sherif — Photography, Cinematography & Creative Visual Storytelling.',
  keywords: ['photography', 'portrait', 'fine art', 'prints', 'sherif'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Virtual by Sherif',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-white min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
