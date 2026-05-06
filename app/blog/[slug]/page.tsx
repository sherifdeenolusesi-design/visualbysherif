import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient()
  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, excerpt')
    .eq('slug', params.slug)
    .single()

  return {
    title: post?.title || 'Blog Post',
    description: post?.excerpt || '',
  }
}

export default async function BlogPostPage({ params }: Props) {
  const supabase = createClient()

  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', params.slug)
    .eq('published', true)
    .single()

  if (!post) notFound()

  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : ''

  return (
    <article className="min-h-screen pt-16">
      {post.cover_image && (
        <div className="relative h-[55vh] overflow-hidden">
          <Image
            src={post.cover_image}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-zinc-950" />
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-16">
        <Link
          href="/blog"
          className="text-white text-sm uppercase tracking-widest hover:text-zinc-300 transition-colors mb-10 inline-block"
        >
          ← Back to Blog
        </Link>

        {post.tags && post.tags.length > 0 && (
          <div className="flex gap-3 mb-5">
            {post.tags.map((tag: string) => (
              <span key={tag} className="text-sm text-white uppercase tracking-widest">
                {tag}
              </span>
            ))}
          </div>
        )}

        <h1 className="text-4xl md:text-5xl font-thin text-white mb-4 leading-tight">
          {post.title}
        </h1>
        <p className="text-white text-sm mb-14 uppercase tracking-widest">{date}</p>

        <div
          className="blog-content"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </div>
    </article>
  )
}
