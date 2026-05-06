import Link from 'next/link'
import Image from 'next/image'
import type { BlogPost } from '@/types'

interface Props {
  post: BlogPost
}

export default function BlogCard({ post }: Props) {
  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : ''

  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <div className="overflow-hidden bg-zinc-100 aspect-video mb-5">
        {post.cover_image ? (
          <Image
            src={post.cover_image}
            alt={post.title}
            width={600}
            height={400}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-200 to-zinc-100" />
        )}
      </div>

      {post.tags && post.tags.length > 0 && (
        <div className="flex gap-3 mb-3">
          {post.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="text-zinc-400 text-sm uppercase tracking-widest">
              {tag}
            </span>
          ))}
        </div>
      )}

      <h2 className="text-zinc-950 font-light text-base mb-2 group-hover:text-zinc-600 transition-colors leading-snug">
        {post.title}
      </h2>
      <p className="text-zinc-400 text-sm line-clamp-2 mb-4 leading-relaxed">{post.excerpt}</p>
      <p className="text-zinc-400 text-sm">{date}</p>
    </Link>
  )
}
