'use client'

import { useState, useRef } from 'react'

// ─── Types ─────────────────────────────────────────────────────────────────
interface Strategy {
  creativeDirection: string
  mood: string
  lightingSetup: { type: string; description: string; equipment: string[]; naturalLight: boolean; goldenHourRecommended: boolean }
  shotList: string[]
  poses: string[]
  locations: { name: string; why: string }[]
  colorGrading: string
  backgroundStyles: string[]
  props: string[]
  outfitTips: string[]
  shootingTips: string[]
}

// ─── Constants ─────────────────────────────────────────────────────────────
const SERVICES = ['Portrait', 'Fashion', 'Wedding', 'Corporate', 'Event', 'Maternity', 'Newborn', 'Commercial', 'Boudoir', 'Street']
const STYLES   = ['Cinematic', 'Editorial', 'Natural & Airy', 'Dark & Moody', 'Glamour', 'Minimalist', 'Vintage Film', 'High Fashion', 'Documentary', 'Fine Art']

// ─── Page ──────────────────────────────────────────────────────────────────
export default function PhotoStudioPage() {
  const [tab, setTab] = useState<'pre' | 'post'>('pre')

  // Pre-shoot state
  const [service,   setService]   = useState('')
  const [outfit,    setOutfit]    = useState('')
  const [style,     setStyle]     = useState('')
  const [colors,    setColors]    = useState('')
  const [location,  setLocation]  = useState('')
  const [planning,  setPlanning]  = useState(false)
  const [strategy,  setStrategy]  = useState<Strategy | null>(null)
  const [inspImgs,  setInspImgs]  = useState<string[]>([])
  const [planError, setPlanError] = useState('')

  // Post-shoot state
  const [uploadedImg,  setUploadedImg]  = useState<string>('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [bgPrompt,     setBgPrompt]     = useState('')
  const [animPrompt,   setAnimPrompt]   = useState('')
  const [inspPrompt,   setInspPrompt]   = useState('')
  const [processing,   setProcessing]   = useState<string>('')
  const [removedBg,    setRemovedBg]    = useState('')
  const [generatedBg,  setGeneratedBg]  = useState('')
  const [animatedUrl,  setAnimatedUrl]  = useState('')
  const [inspBgs,      setInspBgs]      = useState<string[]>([])
  const [editError,    setEditError]    = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Pre-Shoot ─────────────────────────────────────────────────────────
  async function generateStrategy() {
    if (!service || !outfit) { setPlanError('Please select a service and describe the outfit.'); return }
    setPlanError(''); setPlanning(true); setStrategy(null); setInspImgs([])
    try {
      const res  = await fetch('/api/shoot-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service, outfit, style, colors, location }),
      })
      const data = await res.json()
      if (!res.ok) { setPlanError(data.error ?? 'Failed to generate.'); return }
      setStrategy(data.strategy)
      setInspImgs(data.inspirationImages ?? [])
    } catch { setPlanError('Network error. Please try again.') }
    finally { setPlanning(false) }
  }

  // ── Post-Shoot ────────────────────────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadedFile(file)
    const reader = new FileReader()
    reader.onload = ev => setUploadedImg(ev.target?.result as string)
    reader.readAsDataURL(file)
    setRemovedBg(''); setGeneratedBg(''); setAnimatedUrl(''); setInspBgs([])
  }

  async function runOperation(op: string) {
    if (!uploadedImg) { setEditError('Please upload a photo first.'); return }
    setEditError(''); setProcessing(op)
    try {
      const res  = await fetch('/api/photo-editor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: op,
          image_url: uploadedImg,
          prompt: op === 'generate-bg' ? bgPrompt : op === 'animate' ? animPrompt : inspPrompt,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setEditError(data.error ?? 'Processing failed.'); return }
      if (op === 'remove-bg')    setRemovedBg(data.url)
      if (op === 'generate-bg')  setGeneratedBg(data.url)
      if (op === 'animate')      setAnimatedUrl(data.url)
      if (op === 'inspire-bg')   setInspBgs(data.urls ?? [])
    } catch { setEditError('Network error. Please try again.') }
    finally { setProcessing('') }
  }

  // ── Canvas Composite ─────────────────────────────────────────────────
  function compositeAndDownload() {
    if (!removedBg || !generatedBg) return
    const canvas  = document.createElement('canvas')
    const bg      = new Image(); bg.crossOrigin = 'anonymous'
    const subject = new Image(); subject.crossOrigin = 'anonymous'
    bg.src = generatedBg
    bg.onload = () => {
      canvas.width  = bg.naturalWidth
      canvas.height = bg.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(bg, 0, 0)
      subject.src = removedBg
      subject.onload = () => {
        ctx.drawImage(subject, 0, 0, canvas.width, canvas.height)
        const link    = document.createElement('a')
        link.download = 'visual-by-sherif-edited.png'
        link.href     = canvas.toDataURL('image/png')
        link.click()
      }
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-16">
      <div className="max-w-6xl mx-auto px-4">

        {/* Header */}
        <div className="mb-8">
          <p className="text-zinc-600 text-xs uppercase tracking-widest mb-2">Company Use Only</p>
          <h1 className="text-3xl font-thin text-white mb-1">AI Photo Studio</h1>
          <p className="text-zinc-500 text-sm">Strategy planning before the shoot · AI editing after the shoot</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800 mb-8">
          {(['pre', 'post'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-3 text-xs uppercase tracking-widest transition-colors border-b-2 -mb-px ${
                tab === t ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {t === 'pre' ? '✦ Pre-Shoot Planner' : '✦ Post-Shoot Editor'}
            </button>
          ))}
        </div>

        {/* ══════════════ PRE-SHOOT TAB ══════════════ */}
        {tab === 'pre' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Service */}
              <div>
                <p className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Photography Service *</p>
                <div className="grid grid-cols-5 gap-2">
                  {SERVICES.map(s => (
                    <button key={s} onClick={() => setService(s)}
                      className={`py-2 text-xs border transition-colors ${service === s ? 'border-white bg-zinc-800 text-white' : 'border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-white'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Style */}
              <div>
                <p className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Shoot Style</p>
                <div className="grid grid-cols-5 gap-2">
                  {STYLES.map(s => (
                    <button key={s} onClick={() => setStyle(s)}
                      className={`py-2 text-xs border transition-colors ${style === s ? 'border-white bg-zinc-800 text-white' : 'border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-white'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Outfit */}
            <div>
              <p className="text-zinc-400 text-xs uppercase tracking-widest mb-2">Client Outfit Description *</p>
              <textarea value={outfit} onChange={e => setOutfit(e.target.value)} rows={3}
                placeholder="e.g. Floor-length deep burgundy velvet gown with off-shoulder neckline, gold jewellery, black heels…"
                className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 px-4 py-3 text-sm resize-none focus:outline-none focus:border-zinc-600" />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-zinc-400 text-xs uppercase tracking-widest mb-2">Colour Palette</p>
                <input value={colors} onChange={e => setColors(e.target.value)} placeholder="e.g. Deep jewel tones, burgundy, gold, black"
                  className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 px-4 py-3 text-sm focus:outline-none focus:border-zinc-600" />
              </div>
              <div>
                <p className="text-zinc-400 text-xs uppercase tracking-widest mb-2">Location Preference</p>
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Urban rooftop, forest, studio, beach"
                  className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 px-4 py-3 text-sm focus:outline-none focus:border-zinc-600" />
              </div>
            </div>

            {planError && <p className="text-red-400 text-sm">{planError}</p>}

            <button onClick={generateStrategy} disabled={planning}
              className="w-full bg-white text-zinc-950 py-4 text-xs uppercase tracking-widest hover:bg-zinc-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {planning ? (<><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Generating Strategy + Inspiration Images…</>) : '✦ Generate Shoot Strategy'}
            </button>

            {/* Results */}
            {strategy && (
              <div className="space-y-6 mt-4">
                {/* Creative Direction */}
                <div className="border border-zinc-800 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs border border-zinc-700 text-zinc-400 px-2 py-1 uppercase tracking-widest">{strategy.mood}</span>
                    <p className="text-zinc-400 text-xs uppercase tracking-widest">Creative Direction</p>
                  </div>
                  <p className="text-white text-sm leading-relaxed font-light">{strategy.creativeDirection}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Lighting */}
                  <div className="border border-zinc-800 p-5">
                    <p className="text-zinc-400 text-xs uppercase tracking-widest mb-3">💡 Lighting Setup</p>
                    <p className="text-white text-sm font-light mb-2">{strategy.lightingSetup?.type}</p>
                    <p className="text-zinc-500 text-xs mb-3 leading-relaxed">{strategy.lightingSetup?.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {strategy.lightingSetup?.equipment?.map((e, i) => (
                        <span key={i} className="text-[10px] border border-zinc-800 text-zinc-500 px-2 py-0.5">{e}</span>
                      ))}
                    </div>
                    {strategy.lightingSetup?.goldenHourRecommended && (
                      <p className="text-amber-500 text-xs mt-2">⚡ Golden hour recommended</p>
                    )}
                  </div>

                  {/* Color Grading */}
                  <div className="border border-zinc-800 p-5">
                    <p className="text-zinc-400 text-xs uppercase tracking-widest mb-3">🎨 Colour Grading</p>
                    <p className="text-white text-sm font-light leading-relaxed">{strategy.colorGrading}</p>
                    <div className="mt-3 space-y-1">
                      {strategy.backgroundStyles?.map((b, i) => (
                        <p key={i} className="text-zinc-500 text-xs">• {b}</p>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {/* Shot List */}
                  <div className="border border-zinc-800 p-5">
                    <p className="text-zinc-400 text-xs uppercase tracking-widest mb-3">📷 Shot List</p>
                    <ol className="space-y-2">
                      {strategy.shotList?.map((s, i) => (
                        <li key={i} className="flex gap-2 text-xs">
                          <span className="text-zinc-700 font-mono flex-shrink-0">{i + 1}.</span>
                          <span className="text-zinc-400">{s}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Poses */}
                  <div className="border border-zinc-800 p-5">
                    <p className="text-zinc-400 text-xs uppercase tracking-widest mb-3">🕴 Poses</p>
                    <ul className="space-y-2">
                      {strategy.poses?.map((p, i) => (
                        <li key={i} className="text-zinc-400 text-xs flex gap-2"><span className="text-zinc-700">•</span>{p}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Locations */}
                  <div className="border border-zinc-800 p-5">
                    <p className="text-zinc-400 text-xs uppercase tracking-widest mb-3">📍 Locations</p>
                    <div className="space-y-3">
                      {strategy.locations?.map((l, i) => (
                        <div key={i}>
                          <p className="text-white text-xs font-light">{l.name}</p>
                          <p className="text-zinc-600 text-[10px] leading-relaxed">{l.why}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Outfit Tips */}
                  <div className="border border-zinc-800 p-5">
                    <p className="text-zinc-400 text-xs uppercase tracking-widest mb-3">👗 Outfit Tips</p>
                    <ul className="space-y-1.5">
                      {strategy.outfitTips?.map((t, i) => (
                        <li key={i} className="text-zinc-400 text-xs flex gap-2"><span className="text-zinc-700">•</span>{t}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Shooting Tips + Props */}
                  <div className="border border-zinc-800 p-5">
                    <p className="text-zinc-400 text-xs uppercase tracking-widest mb-3">📦 Props & Tips</p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {strategy.props?.map((p, i) => (
                        <span key={i} className="text-[10px] border border-zinc-800 text-zinc-500 px-2 py-0.5">{p}</span>
                      ))}
                    </div>
                    <ul className="space-y-1.5">
                      {strategy.shootingTips?.map((t, i) => (
                        <li key={i} className="text-zinc-400 text-xs flex gap-2"><span className="text-zinc-700">•</span>{t}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Inspiration Images */}
                {inspImgs.length > 0 && (
                  <div>
                    <p className="text-zinc-400 text-xs uppercase tracking-widest mb-4">✦ AI Inspiration Images</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      {inspImgs.map((url, i) => (
                        <div key={i} className="relative overflow-hidden border border-zinc-800">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`Inspiration ${i + 1}`} className="w-full object-cover" />
                          <a href={url} download target="_blank" rel="noreferrer"
                            className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-3 py-1.5 uppercase tracking-widest hover:bg-black transition-colors">
                            Download
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══════════════ POST-SHOOT TAB ══════════════ */}
        {tab === 'post' && (
          <div className="space-y-6">
            {/* Upload */}
            <div>
              <p className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Upload Your Photo</p>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              <div onClick={() => fileRef.current?.click()}
                className="border border-dashed border-zinc-700 p-10 text-center cursor-pointer hover:border-zinc-500 transition-colors">
                {uploadedImg ? (
                  <img src={uploadedImg} alt="Uploaded" className="max-h-64 mx-auto object-contain" />
                ) : (
                  <>
                    <p className="text-zinc-500 text-sm mb-1">Click to upload photo</p>
                    <p className="text-zinc-700 text-xs">JPG, PNG, WEBP supported</p>
                  </>
                )}
              </div>
              {uploadedImg && (
                <button onClick={() => fileRef.current?.click()} className="text-zinc-500 text-xs mt-2 hover:text-white transition-colors">
                  Change photo
                </button>
              )}
            </div>

            {editError && <p className="text-red-400 text-sm">{editError}</p>}

            <div className="grid md:grid-cols-2 gap-4">

              {/* Remove Background */}
              <div className="border border-zinc-800 p-5 space-y-3">
                <p className="text-white text-xs uppercase tracking-widest">① Remove Background</p>
                <p className="text-zinc-600 text-xs">Precisely cuts out the subject, preserving every detail</p>
                <button onClick={() => runOperation('remove-bg')} disabled={!!processing || !uploadedImg}
                  className="w-full border border-zinc-700 text-zinc-300 py-2.5 text-xs uppercase tracking-widest hover:border-white hover:text-white transition-colors disabled:opacity-40">
                  {processing === 'remove-bg' ? 'Removing…' : 'Remove Background'}
                </button>
                {removedBg && (
                  <div className="relative border border-zinc-800 overflow-hidden">
                    <img src={removedBg} alt="Removed background" className="w-full object-contain bg-zinc-900 checkered" />
                    <a href={removedBg} download target="_blank" rel="noreferrer"
                      className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 uppercase tracking-widest">
                      Download PNG
                    </a>
                  </div>
                )}
              </div>

              {/* Generate New Background */}
              <div className="border border-zinc-800 p-5 space-y-3">
                <p className="text-white text-xs uppercase tracking-widest">② Generate Background</p>
                <p className="text-zinc-600 text-xs">AI creates a stunning background matching your outfit and style</p>
                <textarea value={bgPrompt} onChange={e => setBgPrompt(e.target.value)} rows={2}
                  placeholder="e.g. Luxury Moroccan courtyard at golden hour, warm terracotta tones, lush plants…"
                  className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 px-3 py-2 text-xs resize-none focus:outline-none focus:border-zinc-600" />
                <button onClick={() => runOperation('generate-bg')} disabled={!!processing || !uploadedImg}
                  className="w-full border border-zinc-700 text-zinc-300 py-2.5 text-xs uppercase tracking-widest hover:border-white hover:text-white transition-colors disabled:opacity-40">
                  {processing === 'generate-bg' ? 'Generating…' : 'Generate Background'}
                </button>
                {generatedBg && (
                  <div className="relative border border-zinc-800 overflow-hidden">
                    <img src={generatedBg} alt="Generated background" className="w-full object-cover" />
                    <a href={generatedBg} download target="_blank" rel="noreferrer"
                      className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 uppercase tracking-widest">
                      Download
                    </a>
                  </div>
                )}
              </div>

              {/* Composite */}
              {removedBg && generatedBg && (
                <div className="border border-white/20 p-5 space-y-3 md:col-span-2 bg-zinc-900/50">
                  <p className="text-white text-xs uppercase tracking-widest">③ Composite — Merge Subject + Background</p>
                  <p className="text-zinc-500 text-xs">Subject from ① placed onto background from ②, downloaded as high-quality PNG</p>
                  <button onClick={compositeAndDownload}
                    className="w-full bg-white text-zinc-950 py-3 text-xs uppercase tracking-widest hover:bg-zinc-100 transition-colors">
                    ✦ Download Composited Image
                  </button>
                </div>
              )}

              {/* Animate */}
              <div className="border border-zinc-800 p-5 space-y-3">
                <p className="text-white text-xs uppercase tracking-widest">Animate Photo</p>
                <p className="text-zinc-600 text-xs">Turns your still photo into a cinematic video with AI motion</p>
                <textarea value={animPrompt} onChange={e => setAnimPrompt(e.target.value)} rows={2}
                  placeholder="e.g. Gentle wind in hair, slow camera pull back, soft bokeh…"
                  className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 px-3 py-2 text-xs resize-none focus:outline-none focus:border-zinc-600" />
                <button onClick={() => runOperation('animate')} disabled={!!processing || !uploadedImg}
                  className="w-full border border-zinc-700 text-zinc-300 py-2.5 text-xs uppercase tracking-widest hover:border-white hover:text-white transition-colors disabled:opacity-40">
                  {processing === 'animate' ? 'Animating (1–3 min)…' : 'Animate Photo'}
                </button>
                {animatedUrl && (
                  <div className="border border-zinc-800 overflow-hidden">
                    <video src={animatedUrl} controls autoPlay loop className="w-full" />
                    <a href={animatedUrl} download target="_blank" rel="noreferrer"
                      className="block text-center text-zinc-400 text-xs py-2 hover:text-white transition-colors">
                      Download Video
                    </a>
                  </div>
                )}
              </div>

              {/* Inspiration Backgrounds */}
              <div className="border border-zinc-800 p-5 space-y-3">
                <p className="text-white text-xs uppercase tracking-widest">Inspiration Backgrounds</p>
                <p className="text-zinc-600 text-xs">Generate themed backdrop ideas for your shoot</p>
                <textarea value={inspPrompt} onChange={e => setInspPrompt(e.target.value)} rows={2}
                  placeholder="e.g. Dramatic stormy cliffside at sunset, moody and cinematic…"
                  className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 px-3 py-2 text-xs resize-none focus:outline-none focus:border-zinc-600" />
                <button onClick={() => runOperation('inspire-bg')} disabled={!!processing || !uploadedImg}
                  className="w-full border border-zinc-700 text-zinc-300 py-2.5 text-xs uppercase tracking-widest hover:border-white hover:text-white transition-colors disabled:opacity-40">
                  {processing === 'inspire-bg' ? 'Generating…' : 'Generate Backdrops'}
                </button>
                {inspBgs.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {inspBgs.map((url, i) => (
                      <div key={i} className="relative border border-zinc-800 overflow-hidden">
                        <img src={url} alt={`Backdrop ${i + 1}`} className="w-full object-cover" />
                        <a href={url} download target="_blank" rel="noreferrer"
                          className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-[10px] px-2 py-0.5">
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  )
}
