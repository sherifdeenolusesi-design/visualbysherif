'use client'

import { useState } from 'react'
import type { Product } from '@/types'

interface Props {
  product: Product
}

export default function ProductBuySection({ product }: Props) {
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] ?? '')
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleBuy = async () => {
    setLoading(true)
    setError('')

    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: product.id, size: selectedSize, quantity }),
    })

    const data = await res.json()

    if (res.ok && data.url) {
      window.location.href = data.url
    } else {
      setError(data.error || 'Unable to start checkout. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-7">
      {/* Size selector */}
      <div>
        <p className="text-zinc-600 text-xs uppercase tracking-widest mb-3">Print Size</p>
        <div className="flex flex-wrap gap-2">
          {product.sizes.map((size) => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className={`px-4 py-2 text-xs border transition-colors ${
                selectedSize === size
                  ? 'bg-white text-zinc-950 border-white'
                  : 'border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-white'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Quantity */}
      <div>
        <p className="text-zinc-600 text-xs uppercase tracking-widest mb-3">Quantity</p>
        <div className="flex items-center gap-5">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="w-9 h-9 border border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white transition-colors text-lg"
          >
            −
          </button>
          <span className="text-white text-sm w-4 text-center tabular-nums">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => q + 1)}
            className="w-9 h-9 border border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white transition-colors text-lg"
          >
            +
          </button>
        </div>
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <button
        onClick={handleBuy}
        disabled={loading || !selectedSize}
        className="w-full bg-white text-zinc-950 py-4 text-xs uppercase tracking-[0.2em] hover:bg-zinc-100 transition-colors disabled:opacity-50"
      >
        {loading ? 'Redirecting to checkout...' : 'Purchase Print'}
      </button>
    </div>
  )
}
