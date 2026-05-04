'use client'

import { useState, useRef, useCallback } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────
interface Adj { exposure:number; brightness:number; contrast:number; highlights:number; shadows:number; saturation:number; warmth:number; tint:number }
interface CB   { r:number; g:number; b:number }
interface ColorBal { shadows:CB; midtones:CB; highlights:CB }

const DEFAULT_ADJ: Adj = { exposure:0, brightness:0, contrast:0, highlights:0, shadows:0, saturation:0, warmth:0, tint:0 }
const DEFAULT_CB: CB   = { r:0, g:0, b:0 }
const DEFAULT_BAL: ColorBal = { shadows:{...DEFAULT_CB}, midtones:{...DEFAULT_CB}, highlights:{...DEFAULT_CB} }

const PRESETS: Record<string, Adj> = {
  'Natural':   { exposure:5,  brightness:5,  contrast:5,  highlights:-10, shadows:10, saturation:10,  warmth:10, tint:0  },
  'Cinematic': { exposure:-5, brightness:-5, contrast:30, highlights:-30, shadows:20, saturation:-15, warmth:15, tint:-5 },
  'B & W':     { exposure:5,  brightness:0,  contrast:20, highlights:-10, shadows:15, saturation:-100,warmth:0,  tint:0  },
  'Warm':      { exposure:5,  brightness:5,  contrast:5,  highlights:-5,  shadows:10, saturation:15,  warmth:40, tint:5  },
  'Dramatic':  { exposure:-10,brightness:-10,contrast:50, highlights:-40, shadows:30, saturation:-20, warmth:20, tint:0  },
  'Fade':      { exposure:15, brightness:10, contrast:-20,highlights:5,   shadows:30, saturation:-20, warmth:5,  tint:0  },
  'Matte':     { exposure:5,  brightness:5,  contrast:-15,highlights:-5,  shadows:40, saturation:-10, warmth:5,  tint:0  },
  'Portrait':  { exposure:5,  brightness:10, contrast:5,  highlights:-15, shadows:20, saturation:5,   warmth:15, tint:0  },
}

// ── CSS filter (non-destructive live preview) ────────────────────────────────
function buildFilter(a: Adj, skinSmooth = 0): string {
  const bright = 1 + (a.brightness + a.exposure * 0.7 + a.shadows * 0.15) / 100
  const contr  = 1 + (a.contrast - a.highlights * 0.2) / 100
  const sat    = Math.max(0, 1 + a.saturation / 100)
  const sepia  = Math.max(0, Math.min(1, a.warmth / 200))
  const hue    = a.tint * 1.8
  const blur   = (skinSmooth / 100) * 0.8
  let f = `brightness(${bright.toFixed(3)}) contrast(${contr.toFixed(3)}) saturate(${sat.toFixed(3)})`
  if (sepia > 0.001) f += ` sepia(${sepia.toFixed(3)})`
  if (Math.abs(hue) > 0.1) f += ` hue-rotate(${hue.toFixed(1)}deg)`
  if (blur > 0.01) f += ` blur(${blur.toFixed(2)}px)`
  return f
}

// ── Canvas pixel helpers ─────────────────────────────────────────────────────
function getBlurredCanvas(src: HTMLCanvasElement, radius: number): HTMLCanvasElement {
  const tmp = document.createElement('canvas')
  tmp.width = src.width; tmp.height = src.height
  const ctx = tmp.getContext('2d')!
  ctx.filter = `blur(${radius}px)`
  ctx.drawImage(src, 0, 0)
  return tmp
}

function applyFrequencySeparation(canvas: HTMLCanvasElement, smoothing: number, texture: number) {
  const ctx = canvas.getContext('2d')!
  const w = canvas.width, h = canvas.height
  const orig = ctx.getImageData(0, 0, w, h)
  const blurred = getBlurredCanvas(canvas, smoothing * 0.15)
  const blurCtx = blurred.getContext('2d')!
  const blur = blurCtx.getImageData(0, 0, w, h)
  const result = ctx.createImageData(w, h)
  const t = texture / 100
  for (let i = 0; i < orig.data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      result.data[i+c] = Math.round(blur.data[i+c] + (orig.data[i+c] - blur.data[i+c]) * t)
    }
    result.data[i+3] = orig.data[i+3]
  }
  ctx.putImageData(result, 0, 0)
}

function applyAutoWhiteBalance(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const d = data.data
  let rSum=0, gSum=0, bSum=0, n=d.length/4
  for (let i=0;i<d.length;i+=4) { rSum+=d[i]; gSum+=d[i+1]; bSum+=d[i+2] }
  const avg = (rSum+gSum+bSum)/(3*n)
  const rScale=avg/(rSum/n), gScale=avg/(gSum/n), bScale=avg/(bSum/n)
  for (let i=0;i<d.length;i+=4) {
    d[i]  =Math.max(0,Math.min(255,Math.round(d[i]  *rScale)))
    d[i+1]=Math.max(0,Math.min(255,Math.round(d[i+1]*gScale)))
    d[i+2]=Math.max(0,Math.min(255,Math.round(d[i+2]*bScale)))
  }
  ctx.putImageData(data, 0, 0)
}

function applyAutoColorGrade(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const d = data.data
  let rMin=255,rMax=0,gMin=255,gMax=0,bMin=255,bMax=0
  for (let i = 0; i < d.length; i+=4) {
    rMin=Math.min(rMin,d[i]);   rMax=Math.max(rMax,d[i])
    gMin=Math.min(gMin,d[i+1]); gMax=Math.max(gMax,d[i+1])
    bMin=Math.min(bMin,d[i+2]); bMax=Math.max(bMax,d[i+2])
  }
  const rRange=rMax-rMin||1, gRange=gMax-gMin||1, bRange=bMax-bMin||1
  for (let i = 0; i < d.length; i+=4) {
    d[i]   = Math.round((d[i]   - rMin) / rRange * 255)
    d[i+1] = Math.round((d[i+1] - gMin) / gRange * 255)
    d[i+2] = Math.round((d[i+2] - bMin) / bRange * 255)
  }
  ctx.putImageData(data, 0, 0)
}

function applyColorBalance(canvas: HTMLCanvasElement, bal: ColorBal) {
  const ctx = canvas.getContext('2d')!
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const d = data.data
  for (let i = 0; i < d.length; i+=4) {
    const lum = d[i]*0.299 + d[i+1]*0.587 + d[i+2]*0.114
    const sw = Math.max(0, 1 - lum/85)
    const hw = Math.max(0, (lum-170)/85)
    const mw = Math.max(0, 1 - sw - hw)
    for (let c = 0; c < 3; c++) {
      const key = c===0?'r':c===1?'g':'b'
      const shift = (bal.shadows[key]*sw + bal.midtones[key]*mw + bal.highlights[key]*hw) * 0.5
      d[i+c] = Math.max(0, Math.min(255, d[i+c] + shift))
    }
  }
  ctx.putImageData(data, 0, 0)
}

function healBlemish(canvas: HTMLCanvasElement, cx: number, cy: number, radius: number) {
  const ctx = canvas.getContext('2d'); if (!ctx) return
  const r2 = radius * 2
  const sx = Math.max(r2, Math.min(canvas.width-r2,  Math.round(cx)))
  const sy = Math.max(r2, Math.min(canvas.height-r2, Math.round(cy)))
  const ring = ctx.getImageData(sx-r2, sy-r2, r2*2, r2*2).data
  let rS=0,gS=0,bS=0,n=0
  for (let y=0;y<r2*2;y++) for (let x=0;x<r2*2;x++) {
    const dx=x-r2,dy=y-r2,d=Math.sqrt(dx*dx+dy*dy)
    if (d>radius&&d<=r2) { const i=(y*r2*2+x)*4; rS+=ring[i]; gS+=ring[i+1]; bS+=ring[i+2]; n++ }
  }
  if (!n) return
  const aR=rS/n,aG=gS/n,aB=bS/n
  const patch = ctx.getImageData(sx-radius, sy-radius, radius*2, radius*2)
  for (let y=0;y<radius*2;y++) for (let x=0;x<radius*2;x++) {
    const dx=x-radius,dy=y-radius,d=Math.sqrt(dx*dx+dy*dy)
    if (d<=radius) {
      const s=Math.pow(1-d/radius,0.5)*0.85, i=(y*radius*2+x)*4
      patch.data[i]  =patch.data[i]  *(1-s)+aR*s
      patch.data[i+1]=patch.data[i+1]*(1-s)+aG*s
      patch.data[i+2]=patch.data[i+2]*(1-s)+aB*s
    }
  }
  ctx.putImageData(patch, sx-radius, sy-radius)
}

// ── UI helpers ───────────────────────────────────────────────────────────────
function Slider({ label, value, onChange, min=-100, max=100, unit='' }: {label:string;value:number;onChange:(v:number)=>void;min?:number;max?:number;unit?:string}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-zinc-500 text-[10px] w-24 flex-shrink-0 uppercase tracking-wide">{label}</span>
      <input type="range" min={min} max={max} value={value} onChange={e=>onChange(Number(e.target.value))}
        className="flex-1 h-px appearance-none bg-zinc-700 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white" />
      <span className="text-zinc-600 text-[10px] w-8 text-right font-mono">{value>0?`+${value}`:value}{unit}</span>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function RetouchPage() {
  const [hasImage,     setHasImage]     = useState(false)
  const [tab,          setTab]          = useState<'adjust'|'retouch'|'color'>('adjust')
  const [adj,          setAdj]          = useState<Adj>(DEFAULT_ADJ)
  const [skinSmooth,   setSkinSmooth]   = useState(0)
  const [activePreset, setActivePreset] = useState('')
  const [healMode,     setHealMode]     = useState(false)
  const [brushSize,    setBrushSize]    = useState(20)
  const [freqSmooth,   setFreqSmooth]   = useState(50)
  const [freqTexture,  setFreqTexture]  = useState(70)
  const [colorBal,     setColorBal]     = useState<ColorBal>(DEFAULT_BAL)
  const [undoStack,    setUndoStack]    = useState<ImageData[]>([])
  const [processing,   setProcessing]   = useState('')
  const [error,        setError]        = useState('')
  const [showSplit,    setShowSplit]    = useState(false)
  const [splitX,       setSplitX]       = useState(50)
  const [dragging,     setDragging]     = useState(false)

  const canvasRef     = useRef<HTMLCanvasElement>(null)
  const origRef       = useRef<HTMLCanvasElement | null>(null)
  const splitRef      = useRef<HTMLDivElement>(null)

  // ── Undo helpers ─────────────────────────────────────────────────────────
  function saveUndo() {
    const cv = canvasRef.current; if (!cv) return
    const snap = cv.getContext('2d')!.getImageData(0, 0, cv.width, cv.height)
    setUndoStack(s => [...s.slice(-9), snap])
  }

  function undo() {
    if (!undoStack.length) return
    const prev = undoStack[undoStack.length-1]
    const cv = canvasRef.current!
    cv.getContext('2d')!.putImageData(prev, 0, 0)
    setUndoStack(s => s.slice(0,-1))
  }

  // ── Load image ────────────────────────────────────────────────────────────
  function loadIntoCanvas(src: string, resetState = true) {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const MAX = 2400
      let w = img.naturalWidth, h = img.naturalHeight
      if (w>MAX||h>MAX) { const r=Math.min(MAX/w,MAX/h); w=Math.round(w*r); h=Math.round(h*r) }
      const orig = document.createElement('canvas')
      orig.width = w; orig.height = h
      orig.getContext('2d')!.drawImage(img, 0, 0, w, h)
      origRef.current = orig
      const cv = canvasRef.current
      if (!cv) return
      cv.width = w; cv.height = h
      cv.getContext('2d')!.drawImage(img, 0, 0, w, h)
      if (resetState) { setAdj(DEFAULT_ADJ); setSkinSmooth(0); setActivePreset(''); setColorBal(DEFAULT_BAL) }
      setUndoStack([]); setHealMode(false); setShowSplit(false); setHasImage(true)
    }
    img.onerror = () => setError('Failed to load image.')
    img.src = src
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    setError(''); loadIntoCanvas(URL.createObjectURL(f))
  }

  // ── Destructive canvas ops ────────────────────────────────────────────────
  function applyOp(fn: () => void) {
    saveUndo(); fn()
  }

  function doFreqSep() {
    applyOp(() => applyFrequencySeparation(canvasRef.current!, freqSmooth, freqTexture))
  }

  function doAutoBlemish() {
    applyOp(() => applyFrequencySeparation(canvasRef.current!, 60, 65))
  }

  function doAutoGrade() {
    applyOp(() => applyAutoColorGrade(canvasRef.current!))
  }

  function doColorBalance() {
    applyOp(() => applyColorBalance(canvasRef.current!, colorBal))
  }

  function reset() {
    setAdj(DEFAULT_ADJ); setSkinSmooth(0); setActivePreset('')
    setColorBal(DEFAULT_BAL); setUndoStack([])
    if (!origRef.current) return
    const cv = canvasRef.current!
    cv.width = origRef.current.width; cv.height = origRef.current.height
    cv.getContext('2d')!.drawImage(origRef.current, 0, 0)
  }

  // ── Healing brush ─────────────────────────────────────────────────────────
  function handleCanvasPointer(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!healMode || e.buttons===0) return
    const cv = canvasRef.current!
    const rect = cv.getBoundingClientRect()
    const x = (e.clientX-rect.left)*(cv.width/rect.width)
    const y = (e.clientY-rect.top)*(cv.height/rect.height)
    if (e.type==='mousedown') saveUndo()
    healBlemish(cv, x, y, brushSize)
  }

  // ── Split view drag ───────────────────────────────────────────────────────
  function handleSplitDrag(e: React.MouseEvent<HTMLDivElement>) {
    if (!dragging) return
    const rect = splitRef.current!.getBoundingClientRect()
    const pct = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100))
    setSplitX(pct)
  }

  // ── AI ────────────────────────────────────────────────────────────────────
  async function runAI(op: string) {
    if (!hasImage) { setError('Upload a photo first.'); return }
    setError(''); setProcessing(op)
    try {
      const cv = canvasRef.current!
      const baked = document.createElement('canvas')
      baked.width = cv.width; baked.height = cv.height
      const ctx2 = baked.getContext('2d')!
      ctx2.filter = buildFilter(adj, skinSmooth)
      ctx2.drawImage(cv, 0, 0)
      const blob = await new Promise<Blob>(res => baked.toBlob(b => res(b!), 'image/jpeg', 0.95))
      const form = new FormData()
      form.append('operation', op); form.append('image', blob, 'photo.jpg')
      const res = await fetch('/api/photo-retouch', { method:'POST', body:form })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'AI processing failed.'); return }
      loadIntoCanvas(data.url, false)
    } catch (err:any) { setError(err?.message ?? 'Network error.') }
    finally { setProcessing('') }
  }

  // ── Download ──────────────────────────────────────────────────────────────
  function download(fmt: 'jpeg'|'png') {
    const cv = canvasRef.current; if (!cv) return
    const out = document.createElement('canvas')
    out.width = cv.width; out.height = cv.height
    const ctx = out.getContext('2d')!
    ctx.filter = buildFilter(adj, skinSmooth)
    ctx.drawImage(cv, 0, 0)
    const a = document.createElement('a')
    a.download = `vbs-retouch.${fmt}`
    a.href = out.toDataURL(`image/${fmt}`, fmt==='jpeg' ? 0.95 : undefined)
    a.click()
  }

  const filter = buildFilter(adj, skinSmooth)

  // ── CB helper ─────────────────────────────────────────────────────────────
  function setCB(zone: keyof ColorBal, ch: keyof CB, v: number) {
    setColorBal(b => ({ ...b, [zone]: { ...b[zone], [ch]: v } }))
  }

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4">

        <div className="mb-5">
          <p className="text-zinc-600 text-xs uppercase tracking-widest mb-1">Company Use Only</p>
          <h1 className="text-3xl font-thin text-white mb-1">Retouch Studio</h1>
          <p className="text-zinc-500 text-sm">Frequency separation · Auto blemish · Colour balance · Before & after · AI enhancement</p>
        </div>

        {/* Hidden canvas — always mounted so ref is never null */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Upload */}
        {!hasImage && (
          <div className="border border-dashed border-zinc-700 hover:border-zinc-500 transition-colors">
            <label htmlFor="rf" className="flex flex-col items-center justify-center py-28 cursor-pointer w-full">
              <p className="text-white text-3xl mb-4">✦</p>
              <p className="text-white text-sm mb-1">Click to upload a portrait photo</p>
              <p className="text-zinc-600 text-xs">JPG · PNG · WEBP</p>
            </label>
            <input id="rf" type="file" accept="image/*" onChange={onFileChange} className="sr-only" />
            {error && <p className="text-red-400 text-xs text-center pb-4">{error}</p>}
          </div>
        )}

        {/* Editor */}
        {hasImage && (
          <div className="flex gap-4 items-start">

            {/* ── Left panel ── */}
            <div className="w-56 flex-shrink-0 space-y-3">

              {/* Tabs */}
              <div className="flex border-b border-zinc-800">
                {(['adjust','retouch','color'] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`flex-1 py-2 text-[10px] uppercase tracking-widest transition-colors ${tab===t ? 'text-white border-b border-white -mb-px' : 'text-zinc-600 hover:text-zinc-400'}`}>
                    {t}
                  </button>
                ))}
              </div>

              {/* ── ADJUST tab ── */}
              {tab==='adjust' && <>
                <div className="border border-zinc-800 p-3">
                  <p className="text-zinc-400 text-[10px] uppercase tracking-widest mb-2">Presets</p>
                  <div className="grid grid-cols-2 gap-1">
                    {Object.keys(PRESETS).map(n => (
                      <button key={n} onClick={() => { setAdj(PRESETS[n]); setActivePreset(n) }}
                        className={`py-1.5 text-[10px] uppercase tracking-wide border transition-colors ${activePreset===n ? 'border-white bg-zinc-800 text-white' : 'border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-white'}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="border border-zinc-800 p-3 space-y-2.5">
                  <p className="text-zinc-400 text-[10px] uppercase tracking-widest">Light</p>
                  <Slider label="Exposure"   value={adj.exposure}   onChange={v=>setAdj(a=>({...a,exposure:v}))} />
                  <Slider label="Brightness" value={adj.brightness} onChange={v=>setAdj(a=>({...a,brightness:v}))} />
                  <Slider label="Contrast"   value={adj.contrast}   onChange={v=>setAdj(a=>({...a,contrast:v}))} />
                  <Slider label="Highlights" value={adj.highlights} onChange={v=>setAdj(a=>({...a,highlights:v}))} />
                  <Slider label="Shadows"    value={adj.shadows}    onChange={v=>setAdj(a=>({...a,shadows:v}))} />
                </div>
                <div className="border border-zinc-800 p-3 space-y-2.5">
                  <p className="text-zinc-400 text-[10px] uppercase tracking-widest">Colour</p>
                  <Slider label="Saturation" value={adj.saturation} onChange={v=>setAdj(a=>({...a,saturation:v}))} />
                  <Slider label="Warmth"     value={adj.warmth}     onChange={v=>setAdj(a=>({...a,warmth:v}))} />
                  <Slider label="Tint"       value={adj.tint}       onChange={v=>setAdj(a=>({...a,tint:v}))} />
                  <Slider label="Skin Smooth" value={skinSmooth} onChange={setSkinSmooth} min={0} />
                </div>
              </>}

              {/* ── RETOUCH tab ── */}
              {tab==='retouch' && <>
                <div className="border border-zinc-800 p-3 space-y-3">
                  <p className="text-zinc-400 text-[10px] uppercase tracking-widest">Frequency Separation</p>
                  <p className="text-zinc-600 text-[10px] leading-relaxed">Smooths skin tone while preserving natural texture</p>
                  <Slider label="Smoothing" value={freqSmooth} onChange={setFreqSmooth} min={0} max={100} />
                  <Slider label="Texture"   value={freqTexture} onChange={setFreqTexture} min={0} max={100} />
                  <button onClick={doFreqSep}
                    className="w-full border border-zinc-700 text-zinc-300 py-2 text-[10px] uppercase tracking-widest hover:border-white hover:text-white transition-colors">
                    ✦ Apply Freq Separation
                  </button>
                </div>
                <div className="border border-zinc-800 p-3 space-y-2">
                  <p className="text-zinc-400 text-[10px] uppercase tracking-widest">Auto Blemish Removal</p>
                  <p className="text-zinc-600 text-[10px] leading-relaxed">Automatically detects and smooths blemishes using optimal frequency separation</p>
                  <button onClick={doAutoBlemish}
                    className="w-full border border-zinc-700 text-zinc-300 py-2 text-[10px] uppercase tracking-widest hover:border-white hover:text-white transition-colors">
                    ✦ Auto Remove Blemishes
                  </button>
                </div>
                <div className="border border-zinc-800 p-3 space-y-2">
                  <p className="text-zinc-400 text-[10px] uppercase tracking-widest">Manual Healing Brush</p>
                  <button onClick={() => setHealMode(h => !h)}
                    className={`w-full py-2 text-[10px] uppercase tracking-widest border transition-colors ${healMode ? 'border-white bg-white text-zinc-950' : 'border-zinc-700 text-zinc-300 hover:border-white hover:text-white'}`}>
                    {healMode ? '● On — click/drag blemish' : 'Healing Brush'}
                  </button>
                  {healMode && <Slider label="Brush size" value={brushSize} onChange={setBrushSize} min={8} max={60} />}
                </div>
              </>}

              {/* ── COLOR tab ── */}
              {tab==='color' && <>
                <div className="border border-zinc-800 p-3 space-y-2">
                  <p className="text-zinc-400 text-[10px] uppercase tracking-widest">Auto White Balance</p>
                  <p className="text-zinc-600 text-[10px] leading-relaxed">Removes colour casts — corrects warm/cool tones using gray world algorithm</p>
                  <button onClick={() => applyOp(() => applyAutoWhiteBalance(canvasRef.current!))}
                    className="w-full border border-zinc-700 text-zinc-300 py-2 text-[10px] uppercase tracking-widest hover:border-white hover:text-white transition-colors">
                    ✦ Auto White Balance
                  </button>
                </div>
                <div className="border border-zinc-800 p-3 space-y-2">
                  <p className="text-zinc-400 text-[10px] uppercase tracking-widest">Auto Colour Grading</p>
                  <p className="text-zinc-600 text-[10px] leading-relaxed">Analyses histogram and stretches all channels for vivid, balanced colour</p>
                  <button onClick={doAutoGrade}
                    className="w-full border border-zinc-700 text-zinc-300 py-2 text-[10px] uppercase tracking-widest hover:border-white hover:text-white transition-colors">
                    ✦ Auto Colour Grade
                  </button>
                </div>
                {(['shadows','midtones','highlights'] as const).map(zone => (
                  <div key={zone} className="border border-zinc-800 p-3 space-y-2">
                    <p className="text-zinc-400 text-[10px] uppercase tracking-widest">{zone}</p>
                    <Slider label="Red"   value={colorBal[zone].r} onChange={v=>setCB(zone,'r',v)} />
                    <Slider label="Green" value={colorBal[zone].g} onChange={v=>setCB(zone,'g',v)} />
                    <Slider label="Blue"  value={colorBal[zone].b} onChange={v=>setCB(zone,'b',v)} />
                  </div>
                ))}
                <button onClick={doColorBalance}
                  className="w-full border border-zinc-700 text-zinc-300 py-2.5 text-[10px] uppercase tracking-widest hover:border-white hover:text-white transition-colors">
                  ✦ Apply Colour Balance
                </button>
              </>}

              {/* Actions */}
              <div className="space-y-1.5 pt-1">
                <button onClick={undo} disabled={!undoStack.length}
                  className="w-full border border-zinc-800 text-zinc-500 py-2 text-[10px] uppercase tracking-widest hover:border-zinc-600 hover:text-white transition-colors disabled:opacity-30">
                  Undo {undoStack.length>0&&`(${undoStack.length})`}
                </button>
                <button onClick={reset}
                  className="w-full border border-zinc-800 text-zinc-500 py-2 text-[10px] uppercase tracking-widest hover:border-zinc-600 hover:text-white transition-colors">
                  Reset All
                </button>
                <label htmlFor="rf2" className="w-full border border-zinc-800 text-zinc-500 py-2 text-[10px] uppercase tracking-widest hover:border-zinc-600 hover:text-white transition-colors cursor-pointer block text-center">
                  Change Photo
                </label>
                <input id="rf2" type="file" accept="image/*" onChange={onFileChange} className="sr-only" />
              </div>
            </div>

            {/* ── Centre: canvas ── */}
            <div className="flex-1 min-w-0">
              {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

              {/* Toolbar */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <button onClick={() => setShowSplit(s => !s)}
                  className={`px-4 py-2 text-[10px] uppercase tracking-widest border transition-colors ${showSplit ? 'border-white bg-white text-zinc-950' : 'border-zinc-700 text-zinc-400 hover:border-white hover:text-white'}`}>
                  {showSplit ? '● Before / After' : 'Before / After'}
                </button>
                {showSplit && <span className="text-zinc-600 text-[10px]">Drag the line to compare</span>}
              </div>

              {/* ── Split view ── */}
              {showSplit ? (
                <div
                  ref={splitRef}
                  className="relative border border-zinc-800 bg-zinc-900 overflow-hidden select-none"
                  style={{ cursor: 'col-resize' }}
                  onMouseMove={handleSplitDrag}
                  onMouseDown={() => setDragging(true)}
                  onMouseUp={() => setDragging(false)}
                  onMouseLeave={() => setDragging(false)}
                >
                  {/* Before layer (original, full width) */}
                  {origRef.current && (
                    <img
                      src={origRef.current.toDataURL()}
                      alt="Before"
                      style={{ width:'100%', height:'auto', display:'block', userSelect:'none' }}
                      draggable={false}
                    />
                  )}
                  {/* After layer (current canvas with filter, clipped to right) */}
                  <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, clipPath:`inset(0 0 0 ${splitX}%)`, pointerEvents:'none' }}>
                    <canvas ref={canvasRef}
                      style={{ filter, width:'100%', height:'auto', display:'block' }}
                    />
                  </div>
                  {/* Divider line + handle */}
                  <div style={{ position:'absolute', top:0, bottom:0, left:`${splitX}%`, width:2, background:'white', pointerEvents:'none' }}>
                    <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', background:'white', color:'#000', fontSize:10, padding:'4px 6px', whiteSpace:'nowrap', borderRadius:2, fontWeight:600 }}>
                      ◀ BEFORE · AFTER ▶
                    </div>
                  </div>
                  {/* Labels */}
                  <div style={{ position:'absolute', top:8, left:8, background:'rgba(0,0,0,0.6)', color:'#aaa', fontSize:9, padding:'2px 8px', textTransform:'uppercase', letterSpacing:2 }}>Before</div>
                  <div style={{ position:'absolute', top:8, right:8, background:'rgba(0,0,0,0.6)', color:'#fff', fontSize:9, padding:'2px 8px', textTransform:'uppercase', letterSpacing:2 }}>After</div>
                </div>
              ) : (
                /* ── Normal edit view ── */
                <div className={`relative border border-zinc-800 bg-zinc-900 overflow-auto ${healMode ? 'cursor-crosshair' : ''}`}>
                  <canvas
                    ref={canvasRef}
                    style={{ filter, width:'100%', height:'auto', display:'block' }}
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
                        {processing==='enhance'?'AI Enhancing Skin…':processing==='restore'?'AI Restoring Face…':'AI Upscaling 4×…'}
                      </p>
                      <p className="text-zinc-500 text-[10px]">15–60 seconds</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 mt-3">
                <button onClick={() => download('jpeg')} className="flex-1 bg-white text-zinc-950 py-3 text-[10px] uppercase tracking-widest hover:bg-zinc-100 transition-colors">
                  ✦ Download JPEG
                </button>
                <button onClick={() => download('png')} className="px-6 border border-zinc-700 text-zinc-400 py-3 text-[10px] uppercase tracking-widest hover:border-white hover:text-white transition-colors">
                  PNG
                </button>
              </div>
            </div>

            {/* ── Right: AI ── */}
            <div className="w-52 flex-shrink-0 space-y-3">
              <p className="text-zinc-400 text-[10px] uppercase tracking-widest">AI Retouching</p>
              {[
                { op:'enhance', title:'Skin Enhancement', desc:'Smooths skin, removes blemishes, evens tone' },
                { op:'restore', title:'Face Restore',     desc:'Sharpens eyes, enhances facial detail'     },
                { op:'upscale', title:'AI Upscale 4×',   desc:'Enlarges with AI-generated fine detail'    },
              ].map(({op,title,desc}) => (
                <div key={op} className="border border-zinc-800 p-4 space-y-2">
                  <p className="text-white text-xs font-light">{title}</p>
                  <p className="text-zinc-600 text-[10px] leading-relaxed">{desc}</p>
                  <button onClick={() => runAI(op)} disabled={!!processing}
                    className="w-full border border-zinc-700 text-zinc-300 py-2.5 text-[10px] uppercase tracking-widest hover:border-white hover:text-white transition-colors disabled:opacity-40">
                    {processing===op ? 'Processing…' : `✦ ${title}`}
                  </button>
                </div>
              ))}
              <div className="border border-zinc-800 p-3">
                <p className="text-zinc-600 text-[10px] uppercase tracking-wide mb-1">Workflow</p>
                <p className="text-zinc-700 text-[10px] leading-relaxed">1. Auto Blemish Removal<br/>2. Frequency Separation<br/>3. Adjust light & colour<br/>4. Before/After check<br/>5. Download</p>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
