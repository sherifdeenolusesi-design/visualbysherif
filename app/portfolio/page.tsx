import fs from 'fs'
import path from 'path'
import { Suspense } from 'react'
import MasonryGrid from '@/components/portfolio/MasonryGrid'
import SessionDropdown from '@/components/portfolio/SessionDropdown'
import type { Metadata } from 'next'
import type { Photo } from '@/types'

export const metadata: Metadata = {
  title: 'Portfolio',
  description: 'Browse the photography portfolio — portraits, events, and fine art.',
}

const CATEGORIES = ['All', 'Portraits', 'Events']
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp']

function getSubfolders(rootPath: string): string[] {
  if (!fs.existsSync(rootPath)) return []
  return fs
    .readdirSync(rootPath)
    .filter((name) => fs.statSync(path.join(rootPath, name)).isDirectory())
    .sort()
}

function readImages(folderPath: string, category: string, urlBase: string): Photo[] {
  if (!fs.existsSync(folderPath)) return []
  return fs
    .readdirSync(folderPath)
    .filter((f) => IMAGE_EXTS.includes(path.extname(f).toLowerCase()))
    .map((file, i) => ({
      id: `${urlBase}-${file}`,
      url: `${urlBase}/${file}`,
      title: file.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' '),
      description: null,
      category,
      width: 800,
      height: 600,
      order_index: i,
      created_at: '',
    }))
}

function getPhotos(category: string, session: string, event: string): Photo[] {
  const portraitsRoot = path.join(process.cwd(), 'public', 'portfolio', 'portraits')
  const eventsRoot = path.join(process.cwd(), 'public', 'portfolio', 'events')

  if (category === 'Portraits') {
    const subfolders = getSubfolders(portraitsRoot)
    if (subfolders.length > 0) {
      const target = session || null
      const folders = target ? [target] : subfolders
      return folders.flatMap((sub) =>
        readImages(path.join(portraitsRoot, sub), 'Portraits', `/portfolio/portraits/${sub}`)
      )
    }
    return readImages(portraitsRoot, 'Portraits', '/portfolio/portraits')
  }

  if (category === 'Events') {
    const subfolders = getSubfolders(eventsRoot)
    const target = event || null
    const folders = target ? [target] : subfolders
    return folders.flatMap((sub) =>
      readImages(path.join(eventsRoot, sub), 'Events', `/portfolio/events/${sub}`)
    )
  }

  // All — portraits + events
  const portraitSubs = getSubfolders(portraitsRoot)
  const portraits =
    portraitSubs.length > 0
      ? portraitSubs.flatMap((sub) =>
          readImages(path.join(portraitsRoot, sub), 'Portraits', `/portfolio/portraits/${sub}`)
        )
      : readImages(portraitsRoot, 'Portraits', '/portfolio/portraits')

  const eventSubs = getSubfolders(eventsRoot)
  const events = eventSubs.flatMap((sub) =>
    readImages(path.join(eventsRoot, sub), 'Events', `/portfolio/events/${sub}`)
  )

  return [...portraits, ...events]
}

export default function PortfolioPage({
  searchParams,
}: {
  searchParams: { category?: string; session?: string; event?: string }
}) {
  const category = searchParams.category || 'All'
  const session = searchParams.session || ''
  const event = searchParams.event || ''

  const portraitsRoot = path.join(process.cwd(), 'public', 'portfolio', 'portraits')
  const eventsRoot = path.join(process.cwd(), 'public', 'portfolio', 'events')
  const portraitSubfolders = getSubfolders(portraitsRoot)
  const eventSubfolders = getSubfolders(eventsRoot)

  const photos = getPhotos(category, session, event)

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-thin text-center text-white mb-3">Portfolio</h1>
        <p className="text-zinc-500 text-center text-sm mb-14">
          Capturing life's authentic moments
        </p>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {CATEGORIES.map((cat) => (
            <a
              key={cat}
              href={cat === 'All' ? '/portfolio' : `/portfolio?category=${cat}`}
              className={`px-4 py-2 text-xs uppercase tracking-widest transition-colors ${
                category === cat
                  ? 'bg-white text-zinc-950'
                  : 'border border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
              }`}
            >
              {cat}
            </a>
          ))}
        </div>

        {/* Portrait session dropdown */}
        {category === 'Portraits' && portraitSubfolders.length > 0 && (
          <div className="flex justify-center mb-12">
            <Suspense>
              <SessionDropdown
                sessions={portraitSubfolders}
                selected={session}
                category="Portraits"
                paramName="session"
                allLabel="All Portraits"
              />
            </Suspense>
          </div>
        )}

        {/* Event dropdown */}
        {category === 'Events' && eventSubfolders.length > 0 && (
          <div className="flex justify-center mb-12">
            <Suspense>
              <SessionDropdown
                sessions={eventSubfolders}
                selected={event}
                category="Events"
                paramName="event"
                allLabel="All Events"
              />
            </Suspense>
          </div>
        )}

        {category === 'All' && <div className="mb-8" />}

        {photos.length === 0 ? (
          <p className="text-center text-zinc-600 text-sm py-24">
            No images yet. Add a subfolder to{' '}
            <code className="text-zinc-400">public/portfolio/portraits/</code> or{' '}
            <code className="text-zinc-400">public/portfolio/events/</code>
          </p>
        ) : (
          <MasonryGrid photos={photos} />
        )}
      </div>
    </div>
  )
}
