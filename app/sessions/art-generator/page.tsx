'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'

// ─── Types ────────────────────────────────────────────────────────────────────
interface GeneratedImage {
  id: string
  url: string
  prompt: string
  style: string
  aspect: string
}

interface ShopForm {
  title: string
  description: string
  category: string
  price: string
  sizes: string[]
  stock: string
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STYLES = [
  { id: 'landscape',    label: 'Landscape',    icon: '🏔️' },
  { id: 'cityscape',    label: 'Cityscape',    icon: '🌆' },
  { id: 'abstract',     label: 'Abstract',     icon: '🎨' },
  { id: 'portrait',     label: 'Portrait',     icon: '👤' },
  { id: 'seascape',     label: 'Seascape',     icon: '🌊' },
  { id: 'nature',       label: 'Nature',       icon: '🌿' },
  { id: 'architecture', label: 'Architecture', icon: '🏛️' },
  { id: 'minimal',      label: 'Minimal',      icon: '◻️' },
  { id: 'aerial',       label: 'Aerial',       icon: '🛸' },
  { id: 'night',        label: 'Night',        icon: '🌌' },
]

const ASPECTS = [
  { id: 'landscape', label: 'Landscape', ratio: '16:9',  desc: 'Wide print' },
  { id: 'portrait',  label: 'Portrait',  ratio: '4:5',   desc: 'Tall print' },
  { id: 'square',    label: 'Square',    ratio: '1:1',   desc: 'Square print' },
]

const PRINT_SIZES = ['8x10"', '11x14"', '16x20"', '24x30"', '30x40"']

const PROMPTS: Record<string, string[]> = {
  landscape:    ['Golden hour over rolling hills with dramatic storm clouds', 'Snow-capped mountains reflected in a still lake at dawn', 'Autumn forest with misty valley below'],
  cityscape:    ['London skyline at blue hour from Thames bridge', 'New York Times Square light trails at night', 'Dubai skyline with desert foreground'],
  abstract:     ['Bold geometric shapes in deep gold and black', 'Fluid ink wash in ocean blues and emerald greens', 'Fractured mirror reflecting warm amber light'],
  portrait:     ['Silhouette of a figure against a sunset window', 'Close-up of weathered hands of an elder craftsman', 'Environmental portrait in a golden field'],
  seascape:     ['Crashing waves against sea stacks at dusk', 'Calm turquoise ocean at sunrise with no horizon line', 'Storm brewing over the North Sea'],
  nature:       ['Macro dew drops on spider silk in morning light', 'Fallen autumn leaves on dark forest floor', 'Cherry blossom petals against deep blue sky'],
  architecture: ['Gothic cathedral interior with light beams', 'Spiral staircase shot from below in black and white', 'Brutalist concrete facade with geometric shadows'],
  minimal:      ['Single tree on a fog-covered plain', 'Red boat on still grey water', 'White sand dune with single shadow line'],
  aerial:       ['Geometric crop patterns from above in warm tones', 'River delta from birds eye view in turquoise', 'City grid at night with golden light trails'],
  night:        ['Milky Way over mountain silhouette with foreground', 'Star trails over ancient ruins', 'Aurora borealis over frozen lake'],
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function ArtGeneratorPage() {
  const [style,       setStyle]       = useState('landscape')
  const [aspect,      setAspect]      = useState('landscape')
  const [prompt,      setPrompt]      = useState('')
  const [generating,  setGenerating]  = useState(false)
  const [error,       setError]       = useState('')
  const [images,      setImages]      = useState<GeneratedImage[]>([])
  const [shopTarget,  setShopTarget]  = useState<GeneratedImage | null>(null)
  const [shopForm,    setShopForm]    = useState<ShopForm>({
    title: '', description: '', category: 'AI Fine Art',
    price: '7500', sizes: ['8x10"', '11x14"', '16x20"'], stock: '10',
  })
  const [saving,      setSaving]      = useState(false)
  const [saveMsg,     setSaveMsg]     = useState('')
  const promptRef = useRef<HTMLTextAreaElement>(null)

  async function generate() {
    if (!prompt.trim()) { setError('Please describe your vision.'); return }
    setError('')
    setGenerating(true)
    try {
      const res  = await fetch('/api/generate-art', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ prompt, style, aspect_ratio: aspect }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Generation failed.'); return }
      setImages(prev => [{
        id:     Date.now().toString(),
        url:    data.url,
        prompt: data.revised_prompt ?? prompt,
        style,
        aspect,
      }, ...prev])
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  function openShop(img: GeneratedImage) {
    setShopTarget(img)
    setSaveMsg('')
    setShopForm(f => ({ ...f, title: '', description: img.prompt.slice(0, 120) }))
  }

  async function saveToShop() {
    if (!shopTarget) return
    if (!shopForm.title.trim()) { setSaveMsg('error:Please enter a title.'); return }
    setSaving(true)
    setSaveMsg('')
    try {
      const res  = await fetch('/api/art-to-shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url:    shopTarget.url,
          title:        shopForm.title,
          description:  shopForm.description,
          category:     shopForm.category,
          price_pence:  parseInt(shopForm.price) || 7500,
          sizes:        shopForm.sizes,
          stock:        parseInt(shopForm.stock) || 10,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setSaveMsg('error:' + (data.error ?? 'Save failed.')); return }
      setSaveMsg('success:Product added to shop! ID: ' + data.id?.slice(0, 8))
    } catch {
      setSaveMsg('error:Network error.')
    } finally {
      setSaving(false)
    }
  }

  function toggleSize(s: string) {
    setShopForm(f => ({
      ...f,
      sizes: f.sizes.includes(s) ? f.sizes.filter(x => x !== s) : [...f.sizes, s],
    }))
  }

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-16">
      <div className="max-w-6xl mx-auto px-4">

        {/* Header */}
        <div className="mb-10">
          <p className="text-zinc-600 text-xs uppercase tracking-widest mb-2">Company Use Only</p>
          <h1 className="text-3xl font-thin text-white mb-1">AI Fine Art Studio</h1>
          <p className="text-zinc-500 text-sm">Generate museum-quality fine art prints powered by DALL·E 3 HD</p>
        </div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-8">

          {/* ── Left: Controls ── */}
          <div className="space-y-7">

            {/* Style */}
            <div>
              <p className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Art Style</p>
              <div className="grid grid-cols-5 gap-2">
                {STYLES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    className={`flex flex-col items-center gap-1.5 px-2 py-3 border text-xs transition-colors ${
                      style === s.id
                        ? 'border-white bg-zinc-800 text-white'
                        : 'border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                    }`}
                  >
                    <span className="text-lg">{s.icon}</span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt */}
            <div>
              <p className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Describe Your Vision</p>
              <textarea
                ref={promptRef}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) generate() }}
                placeholder="e.g. Golden hour over rolling Scottish Highlands with dramatic storm clouds rolling in…"
                rows={4}
                className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 px-4 py-3 text-sm resize-none focus:outline-none focus:border-zinc-600"
              />
              {/* Inspiration */}
              <div className="mt-2">
                <p className="text-zinc-600 text-xs mb-1.5">Inspiration:</p>
                <div className="flex flex-wrap gap-1.5">
                  {(PROMPTS[style] ?? []).map((p, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(p)}
                      className="text-zinc-500 text-xs border border-zinc-800 px-2.5 py-1 hover:border-zinc-600 hover:text-zinc-300 transition-colors"
                    >
                      {p.length > 45 ? p.slice(0, 45) + '…' : p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Aspect Ratio */}
            <div>
              <p className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Aspect Ratio</p>
              <div className="flex gap-3">
                {ASPECTS.map(a => (
                  <button
                    key={a.id}
                    onClick={() => setAspect(a.id)}
                    className={`flex-1 border py-3 text-xs transition-colors ${
                      aspect === a.id
                        ? 'border-white bg-zinc-800 text-white'
                        : 'border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                    }`}
                  >
                    <span className="block font-mono text-base mb-0.5">{a.ratio}</span>
                    <span>{a.label}</span>
                    <span className="block text-zinc-600 text-[10px]">{a.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate */}
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              onClick={generate}
              disabled={generating}
              className="w-full bg-white text-zinc-950 py-4 text-xs uppercase tracking-widest hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating HD Art…
                </>
              ) : (
                <>✦ Generate Fine Art</>
              )}
            </button>
          </div>

          {/* ── Right: Tips ── */}
          <div className="space-y-4">
            <div className="border border-zinc-800 p-5">
              <p className="text-zinc-400 text-xs uppercase tracking-widest mb-4">Pro Tips</p>
              <ul className="space-y-3 text-zinc-500 text-xs leading-relaxed">
                <li>• <span className="text-zinc-400">Be specific</span> — mention light, time of day, mood, colours</li>
                <li>• <span className="text-zinc-400">Think commercial</span> — what prints sell? Landscapes, cityscapes, and abstracts perform best</li>
                <li>• <span className="text-zinc-400">Name locations</span> — "Scottish Highlands", "Tokyo at night" beats generic descriptions</li>
                <li>• <span className="text-zinc-400">HD quality</span> — every image is generated at DALL·E 3 HD, suitable for large prints</li>
                <li>• <span className="text-zinc-400">⌘ + Enter</span> to generate quickly</li>
              </ul>
            </div>
            <div className="border border-zinc-800 p-5">
              <p className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Workflow</p>
              <ol className="space-y-2 text-zinc-500 text-xs">
                {['Generate art', 'Download if needed', 'Click Add to Shop', 'Set title & price', 'Goes live in your shop'].map((s, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="text-zinc-700 font-mono">{i + 1}.</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {/* ── Generated Gallery ── */}
        {images.length > 0 && (
          <div className="mt-12">
            <p className="text-zinc-400 text-xs uppercase tracking-widest mb-6">
              Generated — {images.length} image{images.length !== 1 ? 's' : ''}
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {images.map(img => (
                <div key={img.id} className="border border-zinc-800 overflow-hidden group">
                  <div className="relative aspect-[4/3] bg-zinc-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.prompt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-zinc-400 text-xs leading-relaxed line-clamp-2 mb-3">{img.prompt}</p>
                    <div className="flex gap-2">
                      <a
                        href={img.url}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 text-center border border-zinc-700 text-zinc-400 py-2 text-xs uppercase tracking-widest hover:border-zinc-500 hover:text-white transition-colors"
                      >
                        Download
                      </a>
                      <button
                        onClick={() => openShop(img)}
                        className="flex-1 bg-white text-zinc-950 py-2 text-xs uppercase tracking-widest hover:bg-zinc-100 transition-colors"
                      >
                        Add to Shop
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Add to Shop Modal ── */}
      {shopTarget && (
        <div className="fixed inset-0 z-50 bg-zinc-950/90 flex items-center justify-center p-4" onClick={() => setShopTarget(null)}>
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-white text-sm uppercase tracking-widest">Add to Shop</h2>
              <button onClick={() => setShopTarget(null)} className="text-zinc-500 hover:text-white text-xl leading-none">×</button>
            </div>

            {/* Preview */}
            <div className="relative h-40 bg-zinc-950 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={shopTarget.url} alt="" className="w-full h-full object-cover opacity-60" />
            </div>

            <div className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-widest block mb-1.5">Product Title *</label>
                <input
                  value={shopForm.title}
                  onChange={e => setShopForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Golden Highlands at Dusk"
                  className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-zinc-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-widest block mb-1.5">Description</label>
                <textarea
                  value={shopForm.description}
                  onChange={e => setShopForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 text-sm resize-none focus:outline-none focus:border-zinc-500"
                />
              </div>

              {/* Category + Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-widest block mb-1.5">Category</label>
                  <select
                    value={shopForm.category}
                    onChange={e => setShopForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 text-sm focus:outline-none"
                  >
                    <option>AI Fine Art</option>
                    <option>Landscape</option>
                    <option>Cityscape</option>
                    <option>Abstract</option>
                    <option>Portrait</option>
                    <option>Nature</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 text-xs uppercase tracking-widest block mb-1.5">Price (£)</label>
                  <input
                    type="number"
                    value={Math.round(parseInt(shopForm.price || '0') / 100)}
                    onChange={e => setShopForm(f => ({ ...f, price: String(parseInt(e.target.value || '0') * 100) }))}
                    min={1}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              {/* Sizes */}
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-widest block mb-1.5">Print Sizes *</label>
                <div className="flex flex-wrap gap-2">
                  {PRINT_SIZES.map(s => (
                    <button
                      key={s}
                      onClick={() => toggleSize(s)}
                      className={`px-3 py-1.5 text-xs border transition-colors ${
                        shopForm.sizes.includes(s)
                          ? 'border-white bg-zinc-700 text-white'
                          : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stock */}
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-widest block mb-1.5">Stock Quantity</label>
                <input
                  type="number"
                  value={shopForm.stock}
                  onChange={e => setShopForm(f => ({ ...f, stock: e.target.value }))}
                  min={1}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-zinc-500"
                />
              </div>

              {saveMsg && (
                <p className={`text-sm ${saveMsg.startsWith('success:') ? 'text-green-400' : 'text-red-400'}`}>
                  {saveMsg.replace(/^(success|error):/, '')}
                </p>
              )}

              <button
                onClick={saveToShop}
                disabled={saving}
                className="w-full bg-white text-zinc-950 py-3 text-xs uppercase tracking-widest hover:bg-zinc-100 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Publish to Shop'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
