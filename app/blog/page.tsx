import { createClient } from '@/lib/supabase/server'
import BlogCard from '@/components/blog/BlogCard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Photography tips, behind the scenes, and stories from the field.',
}

export default async function BlogPage() {
  const supabase = createClient()

  const { data: posts } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('published', true)
    .order('published_at', { ascending: false })

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-5xl mx-auto px-4 py-20">
        <p className="text-zinc-400 uppercase tracking-[0.4em] text-sm text-center mb-6">
          Blog
        </p>
        <h1 className="text-4xl font-thin text-white text-center mb-4">
          Tips &amp; Behind the Scenes
        </h1>
        <p className="text-white text-base text-center mb-20">
          Photography tips, stories, and a look behind the lens.
        </p>

        {posts && posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <p className="text-center text-zinc-400 py-20 text-base">
            No posts yet — check back soon.
          </p>
        )}
      </div>
    </div>
  )
}
