import Link from 'next/link'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'
import type { Product } from '@/types'

interface Props {
  product: Product
}

export default function ProductCard({ product }: Props) {
  return (
    <Link href={`/shop/${product.id}`} className="group block">
      <div className="overflow-hidden bg-zinc-900 aspect-square mb-5">
        <Image
          src={product.image_url}
          alt={product.title}
          width={600}
          height={600}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <h3 className="text-white font-light text-sm mb-1.5 group-hover:text-zinc-300 transition-colors">
        {product.title}
      </h3>
      <p className="text-zinc-400 text-sm">{formatPrice(product.price)}</p>
      <p className="text-zinc-700 text-xs mt-1">
        {product.sizes.length} size{product.sizes.length !== 1 ? 's' : ''} available
      </p>
    </Link>
  )
}
