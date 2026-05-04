'use client'

import { useState, useRef } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────
interface Adj {
  exposure: number; brightness: number; contrast: number
  highlights: number; shadows: number; saturation: number
  warmth: number; tint: number; sharpen: number; skinSmooth: number
}

const DEFAULT: Adj = {
  exposure: 0, brightness: 0, contrast: 0, highlights: 0, shadows: 0,
  saturation: 0, warmth: 0, tint: 0, sharpen: 0, skinSmooth: 0,
}

const PRESETS: Record<string, Adj> = {
  'Natural':   { exposure:5,  brightness:5,  contrast:5,  highlights:-10, shadows:10, saturation:10,  warmth:10, tint:0,  sharpen:10, skinSmooth:20 },
  'Cinematic': { exposure:-5, brightness:-5, contrast:30, highlights:-30, shadows:20, saturation:-15, warmth:15, tint:-5, sharpen:15, skinSmooth:0  },
  'B & W':     { exposure:5,  brightness:0,  contrast:20, highlights:-10, shadows:15, saturation:-100,warmth:0,  tint:0,  sharpen:20, skinSmooth:0  },
  'Warm':      { exposure:5,  brightness:5,  contrast:5,  highlights:-5,  shadows:10, saturation:15,  warmth:40, tint:5,  sharpen:5,  skinSmooth:10 },
  'Dramatic':  { exposure:-10,brightness:-10,contrast:50, highlights:-40, shadows:30, saturation:-20, warmth:20, tint:0,  sharpen:25, skinSmooth:0  },
  'Fade':      { exposure:15, brightness:10, contrast:-20,highlights:5,   shadows:30, saturation:-20, warmth:5,  tint:0,  sharpen:0,  skinSmooth:0  },
  'Matte':     { exposure:5,  brightness:5,  contrast:-15,highlights:-5,  shadows:40, saturation:-10, warmth:5,  tint:0,  sharpen:0,  skinSmooth:0  },
  'Portrait':  { exposure:5,  brightness:10, contrast:5,  highlights:-15, shadows:20, saturation:5,   warmth:15, tint:0,  sharpen:10, skinSmooth:30 },
}

// ── CSS filter builder ───────────────────────────────────────────────────────
function buildFilter(a: Adj): string {
  const bright = 1 + (a.brightness + a.exposure * 0.7 + a.shadows * 0.15) / 100
  const contr  = 1 + (a.contrast - a.highlights * 0.2) / 100
  const sat    = Math.max(0, 1 + a.saturation / 100)
  const sepia  = Math.max(0, Math.min(1, a.warmth / 200))
  const hue    = a.tint * 1.8
  const blur   = (a.skinSmooth / 100) * 0.8
  let f = `brightness(${bright.toFixed(3)}) contrast(${contr.toFixed(3)}) saturate(${sat.toFixed(3)})`
  if (sepia > 0.001) f += ` sepia(${sepia.toFixed(3)})`
  if (Math.abs(hue) > 0.1) f += ` hue-rotate(${hue.toFixed(1)}deg)`
  if (blur > 0.01)  f += ` blur(${blur.toFixed(2)}px)`
  return f
}

// ── Healing brush algorithm ──────────────────────────────────────────────────
function healBlemish(canvas: HTMLCanvasElement, cx: number, cy: number, radius: number) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const r2 = radius * 2
  const sx = Math.max(r2, Math.min(canvas.width  - r2, Math.round(cx)))
  const sy = Math.max(r2, Math.min(canvas.height - r2, Math.round(cy)))

  // Sample surrounding ring for average skin tone
  const ring = ctx.getImageData(sx - r2, sy - r2, r2 * 2, r2 * 2).data
  let rSum = 0, gSum = 0, bSum = 0, n = 0
  for (let y = 0; y < r2 * 2; y++) {
    for (let x = 0; x < r2 * 2; x++) {
      const dx = x - r2, dy = y - r2, d = Math.sqrt(dx * dx + dy * dy)
      if (d > radius && d <= r2) {
        const i = (y * r2 * 2 + x) * 4
        rSum += ring[i]; gSum += ring[i + 1]; bSum += ring[i + 2]; n++
      }
    }
  }
  if (n === 0) return
  const avgR = rSum / n, avgG = gSum / n, avgB = bSum / n

  // Blend average into blemish area with feathered soft edge
  const patch = ctx.getImageData(sx - radius, sy - radius, radius * 2, radius * 2)
  for (let y = 0; y < radius * 2; y++) {
    for (let x = 0; x < radius * 2; x++) {
      const dx = x - radius, dy = y - radius, d = Math.sqrt(dx * dx + dy * dy)
      if (d <= radius) {
        const strength = Math.pow(1 - d / radius, 0.5) * 0.85
        const i = (y * radius * 2 + x) * 4
        patch.data[i]     = patch.data[i]     * (1 - strength) + avgR * strength
        patch.data[i + 1] = patch.data[i + 1] * (1 - strength) + avgG * strength
        patch.data[i + 2] = patch.data[i + 2] * (1 - strength) + avgB * strength
      }
    }
  }
  ctx.putImageData(patch, sx - radius, sy - radius)
}

// ── Slider component ─────────────────────────────────────────────────────────
function AdjSlider({ label, value, onChange, min = -100, max = 100 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-zinc-500 text-[10px] w-20 flex-shrink-0 uppercase tracking-wide">{label}</span>
      <input
        type="range" min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 h-px appearance-none bg-zinc-700 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer"
      />
      <span className="text-zinc-600 text-[10px] w-7 text-right font-mono tabular-nums">
        {value > 0 ? `+${value}` : value}
      </span>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function RetouchPage() {
  const [hasImage,    setHasImage]    = useState(false)
  const [processing,  setProcessing]  = useState('')
  const [error,       setError]       = useState('')
  const [adj,         setAdj]         = useState<Adj>(DEFAULT)
  const [activePreset,setActivePreset]= useState('')
  const [healMode,    setHealMode]    = useState(false)
  const [brushSize,   setBrushSize]   = useState(20)
  const [undoStack,   setUndoStack]   = useState<ImageData[]>([])

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const origRef   = useRef<HTMLCanvasElement | null>(null)
  const fileRef   = useRef<HTMLInputElement>(null)

  // ── Load image → canvas (max 2400px long edge) ───────────────────────────
  function loadSrc(src: string) {
    const img = new Image()
    img.onload = () => {
      const MAX = 2400
      let w = img.naturalWidth, h = img.naturalHeight
      if (w > MAX || h > MAX) {
        const r = Math.min(MAX / w, MAX / h)
        w = Math.round(w * r); h = Math.round(h * r)
      }
      // Save original for reset
      const orig = document.createElement('canvas')
      orig.width = w; orig.height = h
      orig.getContext('2d')!.drawImage(img, 0, 0, w, h)
      origRef.current = orig
      // Draw to main canvas
      const cv = canvasRef.current!
      cv.width = w; cv.height = h
      cv.getContext('2d')!.drawImage(img, 0, 0, w, h)
      setHasImage(true)
    }
    img.src = src
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    setError(''); setAdj(DEFAULT); setActivePreset(''); setHealMode(false); setUndoStack([])
    const reader = new FileReader()
    reader.onload = ev => loadSrc(ev.target?.result as string)
    reader.readAsDataURL(f)
  }

  // ── Preset ───────────────────────────────────────────────────────────────
  function applyPreset(name: string) {
    setAdj(PRESETS[name])
    setActivePreset(name)
  }

  // ── Adj helper ───────────────────────────────────────────────────────────
  function setField(k: keyof Adj, v: number) {
    setAdj(a => ({ ...a, [k]: v }))
    setActivePreset('')
  }

  // ── Healing brush ────────────────────────────────────────────────────────
  function handleCanvasPointer(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!healMode || e.buttons === 0) return
    const cv = canvasRef.current!
    const ctx = cv.getContext('2d')!
    const rect = cv.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (cv.width  / rect.width)
    const y = (e.clientY - rect.top)  * (cv.height / rect.height)
    if (e.type === 'mousedown') {
      setUndoStack(s => [...s.slice(-9), ctx.getImageData(0, 0, cv.width, cv.height)])
    }
    healBlemish(cv, x, y, brushSize)
  }

  // ── Undo ─────────────────────────────────────────────────────────────────
  function undo() {
    if (!undoStack.length) return
    const prev = undoStack[undoStack.length - 1]
    const cv = canvasRef.current!
    cv.width = prev.width; cv.height = prev.height
    cv.getContext('2d')!.putImageData(prev, 0, 0)
    setUndoStack(s => s.slice(0, -1))
  }

  // ── Reset ────────────────────────────────────────────────────────────────
  function reset() {
    setAdj(DEFAULT); setActivePreset(''); setUndoStack([])
    if (!origRef.current) return
    const cv = canvasRef.current!
    cv.width = origRef.current.width; cv.height = origRef.current.height
    cv.getContext('2d')!.drawImage(origRef.current, 0, 0)
  }

  // ── AI processing ────────────────────────────────────────────────────────
  async function runAI(op: string) {
    if (!hasImage) { setError('Upload a photo first.'); return }
    setError(''); setProcessing(op)
    try {
      // Bake current CSS filter adjustments into canvas before sending to AI
      const cv = canvasRef.current!
      const baked = document.createElement('canvas')
      baked.width = cv.width; baked.height = cv.height
      const ctx2 = baked.getContext('2d')!
      ctx2.filter = buildFilter(adj)
      ctx2.drawImage(cv, 0, 0)

      const blob = await new Promise<Blob>(res => baked.toBlob(b => res(b!), 'image/jpeg', 0.95))
      const form = new FormData()
      form.append('operation', op)
      form.append('image', blob, 'photo.jpg')

      const res  = await fetch('/api/photo-retouch', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'AI processing failed.'); return }

      // Load result back into canvas and reset adjustments
      setAdj(DEFAULT); setActivePreset(''); setUndoStack([])
      loadSrc(data.url)
    } catch (err: any) { setError(err?.message ?? 'Network error.') }
    finally { setProcessing('') }
  }

  // ── Download ─────────────────────────────────────────────────────────────
  function download(fmt: 'jpeg' | 'png') {
    const cv = canvasRef.current; if (!cv) return
    const out = document.createElement('canvas')
    out.width = cv.width; out.height = cv.height
    const ctx = out.getContext('2d')!
    ctx.filter = buildFilter(adj)
    ctx.drawImage(cv, 0, 0)
    const link = document.createElement('a')
    link.download = `vbs-retouch.${fmt}`
    link.href = out.toDataURL(`image/${fmt}`, fmt === 'jpeg' ? 0.95 : undefined)
    link.click()
  }

  const filter = buildFilter(adj)

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4">

        {/* Header */}
        <div className="mb-6">
          <p className="text-zinc-600 text-xs uppercase tracking-widest mb-1">Company Use Only</p>
          <h1 className="text-3xl font-thin text-white mb-1">Retouch Studio</h1>
          <p className="text-zinc-500 text-sm">Professional portrait retouching · AI skin enhancement · Healing brush · Presets</p>
        </div>

        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

        {/* Upload zone — visible until a photo is loaded */}
        {!hasImage && (
          <div
            onClick={() => fileRef.current?.click()}
            className="border border-dashed border-zinc-700 p-24 text-center cursor-pointer hover:border-zinc-500 transition-colors"
          >
            <p className="text-zinc-400 text-4xl mb-4">✦</p>
            <p className="text-white text-sm mb-1">Click to upload a portrait photo</p>
            <p className="text-zinc-600 text-xs">JPG, PNG, WEBP supported</p>
          </div>
        )}

        {/* Editor — canvas is ALWAYS in DOM so canvasRef is never null */}
        <div className={hasImage ? 'flex gap-4 items-start' : 'hidden'}>

            {/* ── Left Panel ── */}
            <div className="w-56 flex-shrink-0 space-y-3">

              {/* Presets */}
              <div className="border border-zinc-800 p-3">
                <p className="text-zinc-400 text-[10px] uppercase tracking-widest mb-2">Presets</p>
                <div className="grid grid-cols-2 gap-1">
                  {Object.keys(PRESETS).map(name => (
                    <button key={name} onClick={() => applyPreset(name)}
                      className={`py-1.5 text-[10px] uppercase tracking-wide border transition-colors ${activePreset === name ? 'border-white bg-zinc-800 text-white' : 'border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-white'}`}>
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Light */}
              <div className="border border-zinc-800 p-3 space-y-2.5">
                <p className="text-zinc-400 text-[10px] uppercase tracking-widest">Light</p>
                <AdjSlider label="Exposure"   value={adj.exposure}    onChange={v => setField('exposure', v)} />
                <AdjSlider label="Brightness" value={adj.brightness}  onChange={v => setField('brightness', v)} />
                <AdjSlider label="Contrast"   value={adj.contrast}    onChange={v => setField('contrast', v)} />
                <AdjSlider label="Highlights" value={adj.highlights}  onChange={v => setField('highlights', v)} />
                <AdjSlider label="Shadows"    value={adj.shadows}     onChange={v => setField('shadows', v)} />
              </div>

              {/* Colour */}
              <div className="border border-zinc-800 p-3 space-y-2.5">
                <p className="text-zinc-400 text-[10px] uppercase tracking-widest">Colour</p>
                <AdjSlider label="Saturation" value={adj.saturation}  onChange={v => setField('saturation', v)} />
                <AdjSlider label="Warmth"     value={adj.warmth}      onChange={v => setField('warmth', v)} />
                <AdjSlider label="Tint"       value={adj.tint}        onChange={v => setField('tint', v)} />
              </div>

              {/* Detail */}
              <div className="border border-zinc-800 p-3 space-y-2.5">
                <p className="text-zinc-400 text-[10px] uppercase tracking-widest">Detail & Skin</p>
                <AdjSlider label="Sharpen"     value={adj.sharpen}    onChange={v => setField('sharpen', v)} min={0} />
                <AdjSlider label="Skin Smooth" value={adj.skinSmooth} onChange={v => setField('skinSmooth', v)} min={0} />
              </div>

              {/* Actions */}
              <div className="space-y-1.5">
                <button onClick={undo} disabled={!undoStack.length}
                  className="w-full border border-zinc-800 text-zinc-500 py-2 text-[10px] uppercase tracking-widest hover:border-zinc-600 hover:text-white transition-colors disabled:opacity-30">
                  Undo {undoStack.length > 0 && `(${undoStack.length})`}
                </button>
                <button onClick={reset}
                  className="w-full border border-zinc-800 text-zinc-500 py-2 text-[10px] uppercase tracking-widest hover:border-zinc-600 hover:text-white transition-colors">
                  Reset All
                </button>
                <button onClick={() => fileRef.current?.click()}
                  className="w-full border border-zinc-800 text-zinc-500 py-2 text-[10px] uppercase tracking-widest hover:border-zinc-600 hover:text-white transition-colors">
                  Change Photo
                </button>
              </div>
            </div>

            {/* ── Canvas ── */}
            <div className="flex-1 min-w-0">
              {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

              {/* Healing toolbar */}
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <button onClick={() => setHealMode(h => !h)}
                  className={`px-4 py-2 text-[10px] uppercase tracking-widest border transition-colors ${healMode ? 'border-white bg-white text-zinc-950' : 'border-zinc-700 text-zinc-400 hover:border-white hover:text-white'}`}>
                  {healMode ? '● Healing On — click blemish' : 'Healing Brush'}
                </button>
                {healMode && (
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-600 text-[10px]">Brush size</span>
                    <input type="range" min={8} max={60} value={brushSize} onChange={e => setBrushSize(Number(e.target.value))}
                      className="w-24 h-px appearance-none bg-zinc-700 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white" />
                    <span className="text-zinc-600 text-[10px] font-mono">{brushSize}px</span>
                  </div>
                )}
                <span className="text-zinc-700 text-[10px] ml-auto">Click & drag to paint</span>
              </div>

              {/* The canvas */}
              <div className={`relative border border-zinc-800 bg-zinc-900 overflow-hidden ${healMode ? 'cursor-crosshair' : ''}`}>
                <canvas
                  ref={canvasRef}
                  style={{ filter, width: '100%', display: 'block', maxHeight: '72vh', objectFit: 'contain' }}
                  onMouseDown={handleCanvasPointer}
                  onMouseMove={handleCanvasPointer}
                />
                {processing && (
                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3">
                    <svg className="animate-spin w-8 h-8 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    <p className="text-white text-xs uppercase tracking-widest">
                      {processing === 'enhance' ? 'AI Enhancing Skin…' : processing === 'restore' ? 'AI Restoring Face…' : 'AI Upscaling 4×…'}
                    </p>
                    <p className="text-zinc-500 text-[10px]">This takes 15–60 seconds</p>
                  </div>
                )}
              </div>

              {/* Download */}
              <div className="flex gap-2 mt-3">
                <button onClick={() => download('jpeg')}
                  className="flex-1 bg-white text-zinc-950 py-3 text-[10px] uppercase tracking-widest hover:bg-zinc-100 transition-colors">
                  ✦ Download JPEG
                </button>
                <button onClick={() => download('png')}
                  className="px-6 border border-zinc-700 text-zinc-400 py-3 text-[10px] uppercase tracking-widest hover:border-white hover:text-white transition-colors">
                  PNG
                </button>
              </div>
            </div>

            {/* ── Right Panel: AI ── */}
            <div className="w-52 flex-shrink-0 space-y-3">
              <p className="text-zinc-400 text-[10px] uppercase tracking-widest mb-1">AI Retouching</p>

              <div className="border border-zinc-800 p-4 space-y-2">
                <p className="text-white text-xs font-light">Skin Enhancement</p>
                <p className="text-zinc-600 text-[10px] leading-relaxed">Smooths skin, removes blemishes, evens skin tone automatically</p>
                <button onClick={() => runAI('enhance')} disabled={!!processing}
                  className="w-full border border-zinc-700 text-zinc-300 py-2.5 text-[10px] uppercase tracking-widest hover:border-white hover:text-white transition-colors disabled:opacity-40">
                  {processing === 'enhance' ? 'Processing…' : '✦ AI Enhance Skin'}
                </button>
              </div>

              <div className="border border-zinc-800 p-4 space-y-2">
                <p className="text-white text-xs font-light">Face Restore</p>
                <p className="text-zinc-600 text-[10px] leading-relaxed">Sharpens eyes, enhances facial detail, repairs blurry faces</p>
                <button onClick={() => runAI('restore')} disabled={!!processing}
                  className="w-full border border-zinc-700 text-zinc-300 py-2.5 text-[10px] uppercase tracking-widest hover:border-white hover:text-white transition-colors disabled:opacity-40">
                  {processing === 'restore' ? 'Processing…' : '✦ AI Face Restore'}
                </button>
              </div>

              <div className="border border-zinc-800 p-4 space-y-2">
                <p className="text-white text-xs font-light">AI Upscale 4×</p>
                <p className="text-zinc-600 text-[10px] leading-relaxed">Enlarges image 4× with AI-generated fine detail</p>
                <button onClick={() => runAI('upscale')} disabled={!!processing}
                  className="w-full border border-zinc-700 text-zinc-300 py-2.5 text-[10px] uppercase tracking-widest hover:border-white hover:text-white transition-colors disabled:opacity-40">
                  {processing === 'upscale' ? 'Processing…' : '✦ AI Upscale 4×'}
                </button>
              </div>

              <div className="border border-zinc-800 p-4 bg-zinc-900/40">
                <p className="text-zinc-600 text-[10px] leading-relaxed uppercase tracking-wide mb-1">Workflow tip</p>
                <p className="text-zinc-600 text-[10px] leading-relaxed">1. Use healing brush to remove blemishes manually<br/>2. Run AI Enhance for smooth skin<br/>3. Adjust light & colour<br/>4. Download</p>
              </div>

              <div className="border border-zinc-800 p-3">
                <p className="text-zinc-700 text-[10px] leading-relaxed">AI tools use Replicate credits (~$0.01–0.05 per run). Manual tools are free.</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
