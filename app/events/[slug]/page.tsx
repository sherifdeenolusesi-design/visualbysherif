'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

interface Photo { url: string; name: string }

type ScanState = 'idle' | 'loading-models' | 'ready' | 'scanning' | 'done' | 'no-face' | 'error'

const MODEL_URL = '/models'

async function loadFaceApi() {
  const faceapi = (await import('face-api.js')).default ?? await import('face-api.js')
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ])
  return faceapi
}

async function getDescriptor(faceapi: any, img: HTMLImageElement): Promise<Float32Array | null> {
  const det = await faceapi
    .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks(true)
    .withFaceDescriptor()
  return det ? det.descriptor : null
}

export default function EventGalleryPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const title = slug.replace(/[-_]/g, ' ')

  const [photos, setPhotos] = useState<Photo[]>([])
  const [matched, setMatched] = useState<Photo[] | null>(null)
  const [scanState, setScanState] = useState<ScanState>('idle')
  const [progress, setProgress] = useState(0)
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<Photo | null>(null)
  const [downloading, setDownloading] = useState(false)
  const faceapiRef = useRef<any>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`/api/events/${slug}/photos`)
      .then((r) => r.json())
      .then((d) => setPhotos(d.photos ?? []))
  }, [slug])

  const initModels = useCallback(async () => {
    if (faceapiRef.current) return
    setScanState('loading-models')
    try {
      faceapiRef.current = await loadFaceApi()
      setScanState('ready')
    } catch {
      setScanState('error')
    }
  }, [])

  const handleSelfie = useCallback(async (file: File) => {
    if (!faceapiRef.current) return
    setScanState('scanning')
    setProgress(0)
    const url = URL.createObjectURL(file)
    setSelfieUrl(url)
    const faceapi = faceapiRef.current

    try {
      const selfieImg = await loadImg(url)
      const selfieDesc = await getDescriptor(faceapi, selfieImg)
      if (!selfieDesc) { setScanState('no-face'); return }

      const results: Photo[] = []
      for (let i = 0; i < photos.length; i++) {
        setProgress(Math.round(((i + 1) / photos.length) * 100))
        const img = await loadImg(photos[i].url)
        const dets = await faceapi
          .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks(true)
          .withFaceDescriptors()
        const isMatch = dets.some(
          (d: any) => faceapi.euclideanDistance(selfieDesc, d.descriptor) < 0.5
        )
        if (isMatch) results.push(photos[i])
      }
      setMatched(results)
      setScanState('done')
    } catch {
      setScanState('error')
    }
  }, [photos])

  const downloadAll = useCallback(async () => {
    const list = matched ?? photos
    if (!list.length) return
    setDownloading(true)
    try {
      const zip = new JSZip()
      for (const p of list) {
        const res = await fetch(p.url)
        const blob = await res.blob()
        zip.file(p.name, blob)
      }
      const content = await zip.generateAsync({ type: 'blob' })
      saveAs(content, `${slug}-photos.zip`)
    } finally {
      setDownloading(false)
    }
  }, [matched, photos, slug])

  const reset = () => {
    setMatched(null)
    setScanState('ready')
    setSelfieUrl(null)
    setProgress(0)
  }

  const display = matched !== null ? matched : photos

  return (
    <div className="min-h-screen bg-zinc-950 pt-16">
      <div className="max-w-6xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-zinc-600 uppercase tracking-[0.4em] text-xs mb-2">Event Gallery</p>
          <h1 className="text-4xl font-thin text-white capitalize mb-3">{title}</h1>
          <p className="text-zinc-500 text-sm">
            {matched !== null
              ? `${matched.length} photo${matched.length !== 1 ? 's' : ''} found with your face`
              : `${photos.length} photos`}
          </p>
        </div>

        {/* AI Face Finder panel */}
        <div className="border border-zinc-800 p-6 mb-10 max-w-2xl mx-auto">
          <div className="flex items-start gap-4">
            {selfieUrl && (
              <img src={selfieUrl} alt="Your selfie" className="w-16 h-16 object-cover rounded-full border border-zinc-700 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className="text-white text-sm font-light mb-1">
                {scanState === 'idle' && 'Find photos of you using AI face recognition'}
                {scanState === 'loading-models' && 'Loading AI models…'}
                {scanState === 'ready' && 'Upload a selfie and AI will find your photos'}
                {scanState === 'scanning' && `Scanning photos… ${progress}%`}
                {scanState === 'done' && `Scan complete — ${matched?.length ?? 0} match${matched?.length !== 1 ? 'es' : ''} found`}
                {scanState === 'no-face' && 'No face detected in your selfie — please try another photo'}
                {scanState === 'error' && 'Something went wrong — please try again'}
              </p>
              {scanState === 'scanning' && (
                <div className="w-full bg-zinc-800 h-1 mt-2">
                  <div className="bg-white h-1 transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              )}
              {(scanState === 'idle') && (
                <button
                  onClick={initModels}
                  className="mt-3 bg-white text-zinc-950 px-5 py-2 text-xs uppercase tracking-widest hover:bg-zinc-100 transition-colors"
                >
                  Find My Photos
                </button>
              )}
              {(scanState === 'ready' || scanState === 'no-face' || scanState === 'error') && (
                <div className="flex gap-3 mt-3 flex-wrap">
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleSelfie(e.target.files[0])} />
                  <input ref={cameraRef} type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => e.target.files?.[0] && handleSelfie(e.target.files[0])} />
                  <button onClick={() => cameraRef.current?.click()} className="bg-white text-zinc-950 px-4 py-2 text-xs uppercase tracking-widest hover:bg-zinc-100 transition-colors">
                    Take Selfie
                  </button>
                  <button onClick={() => fileRef.current?.click()} className="border border-zinc-700 text-zinc-400 hover:text-white px-4 py-2 text-xs uppercase tracking-widest transition-colors">
                    Upload Photo
                  </button>
                </div>
              )}
              {scanState === 'done' && (
                <div className="flex gap-3 mt-3 flex-wrap">
                  <button onClick={reset} className="border border-zinc-700 text-zinc-400 hover:text-white px-4 py-2 text-xs uppercase tracking-widest transition-colors">
                    Scan Again
                  </button>
                  <button onClick={() => setMatched(null)} className="border border-zinc-700 text-zinc-400 hover:text-white px-4 py-2 text-xs uppercase tracking-widest transition-colors">
                    View All Photos
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Download bar */}
        {display.length > 0 && (
          <div className="flex items-center justify-between mb-6">
            <p className="text-zinc-500 text-xs uppercase tracking-widest">
              {matched !== null ? 'Your photos' : 'All photos'}
            </p>
            <button
              onClick={downloadAll}
              disabled={downloading}
              className="flex items-center gap-2 bg-white text-zinc-950 px-4 py-2 text-xs uppercase tracking-widest hover:bg-zinc-100 transition-colors disabled:opacity-50"
            >
              {downloading ? 'Preparing…' : `Download ${matched !== null ? 'My Photos' : 'All'} (ZIP)`}
            </button>
          </div>
        )}

        {/* Photo grid */}
        {display.length === 0 && scanState === 'done' ? (
          <div className="text-center py-24">
            <p className="text-zinc-600 text-sm">No photos found matching your face.</p>
            <button onClick={reset} className="mt-4 text-zinc-500 hover:text-white text-xs uppercase tracking-widest transition-colors">
              Try Again
            </button>
          </div>
        ) : (
          <div className="masonry-grid">
            {display.map((photo) => (
              <div
                key={photo.url}
                className="masonry-item relative overflow-hidden cursor-pointer group bg-zinc-900"
                onClick={() => setLightbox(photo)}
              >
                <Image
                  src={photo.url}
                  alt={photo.name}
                  width={800}
                  height={600}
                  className="w-full h-auto block transition-transform duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-end justify-end p-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); downloadSingle(photo) }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-zinc-950 px-3 py-1.5 text-[10px] uppercase tracking-widest"
                  >
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox.url}
            alt={lightbox.name}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white text-2xl w-10 h-10 flex items-center justify-center border border-zinc-700 hover:border-white transition-colors"
          >
            ×
          </button>
          <button
            onClick={() => downloadSingle(lightbox)}
            className="absolute bottom-4 right-4 bg-white text-zinc-950 px-4 py-2 text-xs uppercase tracking-widest hover:bg-zinc-100 transition-colors"
          >
            Download
          </button>
        </div>
      )}
    </div>
  )
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = document.createElement('img')
    img.crossOrigin = 'anonymous'
    img.onload = () => res(img)
    img.onerror = rej
    img.src = src
  })
}

function downloadSingle(photo: Photo) {
  fetch(photo.url)
    .then((r) => r.blob())
    .then((b) => saveAs(b, photo.name))
}
