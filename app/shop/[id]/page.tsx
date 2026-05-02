import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import ProductBuySection from '@/components/shop/ProductBuySection'
import { formatPrice } from '@/lib/utils'
import type { Metadata } from 'next'

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient()
  const { data: product } = await supabase
    .from('print_products')
    .select('title, description')
    .eq('id', params.id)
    .single()

  return {
    title: product?.title || 'Print',
    description: product?.description || '',
  }
}

export default async function ProductPage({ params }: Props) {
  const supabase = createClient()

  const { data: product } = await supabase
    .from('print_products')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!product) notFound()

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-6xl mx-auto px-4 py-20">
        <Link
          href="/shop"
          className="text-zinc-600 text-xs uppercase tracking-widest hover:text-white transition-colors mb-14 inline-block"
        >
          ← Back to Shop
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
          <div className="bg-zinc-900 overflow-hidden aspect-square">
            <Image
              src={product.image_url}
              alt={product.title}
              width={800}
              height={800}
              className="w-full h-full object-cover"
              priority
            />
          </div>

          <div className="flex flex-col justify-center">
            <p className="text-zinc-600 text-xs uppercase tracking-widest mb-4">
              {product.category}
            </p>
            <h1 className="text-3xl font-thin text-white mb-4">{product.title}</h1>
            <p className="text-2xl text-white font-light mb-6">{formatPrice(product.price)}</p>
            <p className="text-zinc-500 text-sm leading-relaxed mb-10">{product.description}</p>

            <ProductBuySection product={product} />

            <ul className="mt-10 pt-10 border-t border-zinc-900 space-y-2.5 text-xs text-zinc-600">
              <li>✓ Museum-quality archival paper</li>
              <li>✓ Professionally produced &amp; quality checked</li>
              <li>✓ Ships within 5–7 business days</li>
              <li>✓ Satisfaction guaranteed</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
