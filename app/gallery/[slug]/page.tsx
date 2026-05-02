import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import GalleryUnlock from '@/components/gallery/GalleryUnlock'
import type { Metadata } from 'next'

interface Props {
  params: { slug: string }
}

export const metadata: Metadata = {
  title: 'Client Gallery',
  robots: 'noindex, nofollow',
}

export default async function ClientGalleryPage({ params }: Props) {
  const supabase = createClient()

  const { data: gallery } = await supabase
    .from('client_galleries')
    .select('id, name, slug, description, cover_image, expires_at')
    .eq('slug', params.slug)
    .single()

  if (!gallery) notFound()

  if (gallery.expires_at && new Date(gallery.expires_at) < new Date()) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-thin text-white mb-4">Gallery Expired</h1>
          <p className="text-zinc-500 text-sm">
            This gallery is no longer available.{' '}
            <a href="/contact" className="text-zinc-400 hover:text-white transition-colors">
              Contact the photographer
            </a>
            .
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-16">
      <GalleryUnlock gallery={gallery} />
    </div>
  )
}
