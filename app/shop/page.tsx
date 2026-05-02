import { createClient } from '@/lib/supabase/server'
import ProductCard from '@/components/shop/ProductCard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Print Shop',
  description: 'Museum-quality fine art prints, ready to hang.',
}

export default async function ShopPage() {
  const supabase = createClient()

  const { data: products } = await supabase
    .from('print_products')
    .select('*')
    .gt('stock', 0)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-6xl mx-auto px-4 py-20">
        <p className="text-zinc-600 uppercase tracking-[0.4em] text-xs text-center mb-6">
          Fine Art
        </p>
        <h1 className="text-4xl font-thin text-white text-center mb-4">Print Shop</h1>
        <p className="text-zinc-500 text-sm text-center mb-20">
          Museum-quality prints on archival paper, professionally produced.
        </p>

        {products && products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-center text-zinc-700 py-20 text-sm">
            New prints coming soon.
          </p>
        )}
      </div>
    </div>
  )
}
