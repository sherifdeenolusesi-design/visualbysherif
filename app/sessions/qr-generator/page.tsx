'use client'

import { useState, useEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface EventFolder { name: string; count: number }

export default function QRGeneratorPage() {
  const [events, setEvents] = useState<EventFolder[]>([])
  const [selected, setSelected] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setBaseUrl(window.location.origin)
    fetch('/api/events/list')
      .then((r) => r.json())
      .then((d) => {
        setEvents(d.events ?? [])
        if (d.events?.length) setSelected(d.events[0].name)
      })
  }, [])

  const galleryUrl = selected ? `${baseUrl}/events/${encodeURIComponent(selected)}` : ''

  const handlePrint = () => {
    if (!printRef.current) return
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html><head><title>QR Code — ${selected}</title>
      <style>
        body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: white; color: #111; }
        h1 { font-size: 28px; font-weight: 300; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 4px; }
        p { color: #666; font-size: 12px; letter-spacing: 0.1em; margin: 4px 0; }
        .qr { margin: 24px 0; }
        .url { font-size: 11px; color: #888; word-break: break-all; max-width: 300px; text-align: center; }
      </style></head>
      <body>
        <h1>Visual by Sherif</h1>
        <p>${selected} — Event Gallery</p>
        <div class="qr">${printRef.current.innerHTML}</div>
        <p class="url">Scan to access your photos</p>
        <p class="url" style="margin-top:8px;font-size:10px">${galleryUrl}</p>
      </body></html>
    `)
    win.document.close()
    win.print()
  }

  const handleDownloadSvg = () => {
    if (!printRef.current) return
    const svg = printRef.current.querySelector('svg')
    if (!svg) return
    const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `qr-${selected}.svg`
    a.click()
  }

  return (
    <div className="min-h-screen pt-16 bg-zinc-950">
      <div className="max-w-4xl mx-auto px-4 py-12">

        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-zinc-600 uppercase tracking-[0.4em] text-xs mb-2">Sessions</p>
            <h1 className="text-3xl font-thin text-white">QR Code Generator</h1>
          </div>
          {selected && (
            <div className="flex gap-3">
              <button
                onClick={handleDownloadSvg}
                className="border border-zinc-700 text-zinc-400 hover:text-white px-5 py-2.5 text-xs uppercase tracking-widest transition-colors"
              >
                Download SVG
              </button>
              <button
                onClick={handlePrint}
                className="bg-white text-zinc-950 px-5 py-2.5 text-xs uppercase tracking-widest hover:bg-zinc-100 transition-colors"
              >
                Print
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Controls */}
          <div className="space-y-6">
            <div className="border border-zinc-800 p-6">
              <p className="text-zinc-500 text-xs uppercase tracking-widest mb-4">Select Event</p>
              {events.length === 0 ? (
                <p className="text-zinc-600 text-sm">No event folders found in public/portfolio/events/</p>
              ) : (
                <div className="space-y-2">
                  {events.map((ev) => (
                    <button
                      key={ev.name}
                      onClick={() => setSelected(ev.name)}
                      className={`w-full text-left p-4 border transition-colors ${
                        selected === ev.name
                          ? 'border-white bg-zinc-900'
                          : 'border-zinc-800 hover:border-zinc-600'
                      }`}
                    >
                      <p className={`text-xs uppercase tracking-widest mb-0.5 ${selected === ev.name ? 'text-white' : 'text-zinc-400'}`}>
                        {ev.name}
                      </p>
                      <p className="text-zinc-600 text-[11px]">{ev.count} photos</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selected && (
              <div className="border border-zinc-800 p-6 space-y-3">
                <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Gallery URL</p>
                <p className="text-zinc-400 text-xs break-all font-mono leading-relaxed">{galleryUrl}</p>
                <button
                  onClick={() => navigator.clipboard.writeText(galleryUrl)}
                  className="text-zinc-600 hover:text-white text-xs uppercase tracking-widest transition-colors"
                >
                  Copy URL
                </button>
              </div>
            )}

            <div className="border border-zinc-800 p-6">
              <p className="text-zinc-500 text-xs uppercase tracking-widest mb-3">How It Works</p>
              <ol className="space-y-2 text-zinc-500 text-xs leading-relaxed list-none">
                {[
                  'Print or display the QR code at the event',
                  'Guests scan the QR with their phone camera',
                  'They land on the event gallery page',
                  'Tap "Find My Photos" and take a selfie',
                  'AI scans all photos and shows only theirs',
                  'They download their photos instantly',
                ].map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-zinc-700 flex-shrink-0">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Right: QR preview */}
          <div className="flex flex-col items-center">
            {selected && galleryUrl ? (
              <div className="border border-zinc-800 p-8 flex flex-col items-center gap-6 w-full">
                <p className="text-zinc-500 text-xs uppercase tracking-widest">QR Code Preview</p>
                <div ref={printRef} className="bg-white p-6 inline-block">
                  <QRCodeSVG
                    value={galleryUrl}
                    size={240}
                    level="H"
                    includeMargin
                  />
                </div>
                <div className="text-center">
                  <p className="text-white text-sm font-light capitalize mb-1">{selected} Gallery</p>
                  <p className="text-zinc-600 text-xs">Scan to access your photos</p>
                </div>
                <div className="w-full border-t border-zinc-800 pt-4 text-center">
                  <p className="text-zinc-700 text-[10px] font-mono break-all">{galleryUrl}</p>
                </div>
              </div>
            ) : (
              <div className="border border-zinc-800 p-8 flex items-center justify-center w-full min-h-[400px]">
                <p className="text-zinc-700 text-sm">Select an event to generate QR code</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
