'use client'

import { useState, useEffect } from 'react'

interface Post {
  id: string; title: string; slug: string; excerpt: string
  cover_image: string | null; published: boolean
  published_at: string | null; tags: string[]; created_at: string
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function BlogAdminPage() {
  const [posts,       setPosts]       = useState<Post[]>([])
  const [loading,     setLoading]     = useState(true)
  const [view,        setView]        = useState<'list' | 'new' | 'edit'>('list')
  const [editPost,    setEditPost]    = useState<Post | null>(null)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')
  const [genLoading,  setGenLoading]  = useState(false)

  // Form state
  const [title,       setTitle]       = useState('')
  const [content,     setContent]     = useState('')
  const [excerpt,     setExcerpt]     = useState('')
  const [tagsInput,   setTagsInput]   = useState('')
  const [published,   setPublished]   = useState(false)
  const [coverImage,  setCoverImage]  = useState('')
  const [customPrompt,setCustomPrompt]= useState('')

  useEffect(() => { fetchPosts() }, [])

  async function fetchPosts() {
    setLoading(true)
    const res  = await fetch('/api/blog-admin')
    const data = await res.json()
    setPosts(data.posts ?? [])
    setLoading(false)
  }

  function openNew() {
    setTitle(''); setContent(''); setExcerpt(''); setTagsInput('')
    setPublished(false); setCoverImage(''); setCustomPrompt('')
    setEditPost(null); setError(''); setView('new')
  }

  function openEdit(p: Post) {
    setTitle(p.title); setContent(''); setExcerpt(p.excerpt)
    setTagsInput(p.tags.join(', ')); setPublished(p.published)
    setCoverImage(p.cover_image ?? ''); setCustomPrompt(''); setError('')
    setEditPost(p); setView('edit')
  }

  async function generateImage() {
    if (!title) { setError('Enter a title first.'); return }
    setGenLoading(true); setError('')
    try {
      const res  = await fetch('/api/blog-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content: ' ', generate_image: true, custom_prompt: customPrompt || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed.'); return }
      setCoverImage(data.post?.cover_image ?? '')
      // Remove the temporary post we created just for image gen
      if (data.post?.id) {
        await fetch('/api/blog-admin', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: data.post.id }) })
      }
    } catch { setError('Network error.') }
    finally { setGenLoading(false) }
  }

  async function regenImageForPost(postId: string, postTitle: string) {
    if (!confirm('Regenerate cover image for this post?')) return
    const res  = await fetch('/api/blog-admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: postId, title: postTitle, generate_image: true }),
    })
    if (res.ok) fetchPosts()
  }

  async function savePost() {
    if (!title.trim() || !content.trim()) { setError('Title and content are required.'); return }
    setSaving(true); setError('')
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean)
    try {
      if (view === 'new') {
        const res  = await fetch('/api/blog-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content, excerpt, tags, published, cover_image: coverImage || null }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? 'Failed.'); return }
      } else if (editPost) {
        const res  = await fetch('/api/blog-admin', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editPost.id, title, excerpt, tags, published, cover_image: coverImage || null, ...(content ? { content } : {}) }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? 'Failed.'); return }
      }
      await fetchPosts()
      setView('list')
    } catch { setError('Network error.') }
    finally { setSaving(false) }
  }

  async function togglePublish(p: Post) {
    await fetch('/api/blog-admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: p.id, published: !p.published }),
    })
    fetchPosts()
  }

  async function deletePost(p: Post) {
    if (!confirm(`Delete "${p.title}"? This cannot be undone.`)) return
    await fetch('/api/blog-admin', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: p.id }) })
    fetchPosts()
  }

  // ── Form (shared for new + edit) ────────────────────────────────────────
  const Form = () => (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => setView('list')} className="text-zinc-500 hover:text-white transition-colors text-xs uppercase tracking-widest">← Back</button>
        <h2 className="text-white text-xl font-thin">{view === 'new' ? 'New Post' : 'Edit Post'}</h2>
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      {/* Cover image */}
      <div>
        <p className="text-zinc-400 text-xs uppercase tracking-widest mb-2">Cover Image</p>
        {coverImage && (
          <div className="mb-3 border border-zinc-800 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverImage} alt="Cover" className="w-full max-h-48 object-cover" />
          </div>
        )}
        <div className="space-y-2">
          <input value={customPrompt} onChange={e => setCustomPrompt(e.target.value)}
            placeholder="Custom image prompt (optional — leave blank to auto-generate from title)"
            className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 px-3 py-2.5 text-sm focus:outline-none focus:border-zinc-600" />
          <div className="flex gap-2">
            <button onClick={generateImage} disabled={genLoading || !title}
              className="flex-1 border border-zinc-700 text-zinc-300 py-2.5 text-xs uppercase tracking-widest hover:border-white hover:text-white transition-colors disabled:opacity-40">
              {genLoading ? 'Generating Image…' : '✦ Generate AI Cover Image'}
            </button>
            {coverImage && (
              <button onClick={() => setCoverImage('')} className="px-4 border border-zinc-800 text-zinc-600 text-xs hover:border-zinc-600 hover:text-white transition-colors">
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Title */}
      <div>
        <p className="text-zinc-400 text-xs uppercase tracking-widest mb-2">Title *</p>
        <input value={title} onChange={e => setTitle(e.target.value)}
          placeholder="e.g. 5 Tips for Better Portrait Photography"
          className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 px-4 py-3 text-sm focus:outline-none focus:border-zinc-600" />
      </div>

      {/* Excerpt */}
      <div>
        <p className="text-zinc-400 text-xs uppercase tracking-widest mb-2">Excerpt</p>
        <input value={excerpt} onChange={e => setExcerpt(e.target.value)}
          placeholder="Short summary shown on blog listing page"
          className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 px-4 py-3 text-sm focus:outline-none focus:border-zinc-600" />
      </div>

      {/* Content */}
      <div>
        <p className="text-zinc-400 text-xs uppercase tracking-widest mb-2">Content * {view === 'edit' && <span className="text-zinc-600 normal-case">(leave blank to keep existing)</span>}</p>
        <textarea value={content} onChange={e => setContent(e.target.value)} rows={14}
          placeholder="Write your blog post content here. You can use basic HTML like <h2>, <p>, <strong>, <em>, <ul>, <li>."
          className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 px-4 py-3 text-sm resize-y focus:outline-none focus:border-zinc-600 font-mono" />
      </div>

      {/* Tags */}
      <div>
        <p className="text-zinc-400 text-xs uppercase tracking-widest mb-2">Tags</p>
        <input value={tagsInput} onChange={e => setTagsInput(e.target.value)}
          placeholder="portrait, lighting, tips (comma separated)"
          className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 px-4 py-3 text-sm focus:outline-none focus:border-zinc-600" />
      </div>

      {/* Publish toggle */}
      <div className="flex items-center gap-3">
        <button onClick={() => setPublished(p => !p)}
          className={`w-10 h-5 rounded-full transition-colors relative ${published ? 'bg-white' : 'bg-zinc-700'}`}>
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-zinc-950 transition-all ${published ? 'left-5' : 'left-0.5'}`} />
        </button>
        <span className="text-zinc-400 text-xs uppercase tracking-widest">{published ? 'Published — visible to public' : 'Draft — hidden from public'}</span>
      </div>

      <button onClick={savePost} disabled={saving}
        className="w-full bg-white text-zinc-950 py-3.5 text-xs uppercase tracking-widest hover:bg-zinc-100 transition-colors disabled:opacity-50">
        {saving ? 'Saving…' : view === 'new' ? '✦ Create Post' : '✦ Save Changes'}
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-16">
      <div className="max-w-5xl mx-auto px-4">

        {(view === 'new' || view === 'edit') ? <Form /> : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-zinc-600 text-xs uppercase tracking-widest mb-1">Company Use Only</p>
                <h1 className="text-3xl font-thin text-white">Blog Manager</h1>
                <p className="text-zinc-500 text-sm mt-1">Create and manage blog posts with AI-generated cover images</p>
              </div>
              <button onClick={openNew}
                className="bg-white text-zinc-950 px-6 py-3 text-xs uppercase tracking-widest hover:bg-zinc-100 transition-colors">
                ✦ New Post
              </button>
            </div>

            {/* n8n info */}
            <div className="border border-zinc-800 bg-zinc-900/30 p-4 mb-6">
              <p className="text-zinc-400 text-xs uppercase tracking-widest mb-1">n8n Automation Webhook</p>
              <p className="text-zinc-500 text-xs mb-2">Point your n8n HTTP Request node to this endpoint to auto-create posts:</p>
              <code className="text-zinc-300 text-xs bg-zinc-900 px-3 py-1.5 block">
                POST https://visualbysherif.com/api/n8n-blog
              </code>
              <p className="text-zinc-600 text-xs mt-2">Body: {'{ "title", "content", "excerpt", "tags": [], "published": true, "admin_token": "vbs-sherif-admin-2025-xk9" }'}</p>
              <p className="text-zinc-600 text-xs">Set <code>generate_image: true</code> in the body to auto-generate a cover image.</p>
            </div>

            {/* Post list */}
            {loading ? (
              <div className="text-zinc-600 text-sm text-center py-16">Loading posts…</div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-zinc-800">
                <p className="text-zinc-500 text-sm mb-4">No blog posts yet</p>
                <button onClick={openNew} className="text-white text-xs uppercase tracking-widest border border-zinc-700 px-6 py-3 hover:border-white transition-colors">
                  Create your first post
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map(p => (
                  <div key={p.id} className="border border-zinc-800 flex gap-4 p-4 hover:border-zinc-700 transition-colors">
                    {/* Thumbnail */}
                    <div className="w-24 h-16 flex-shrink-0 bg-zinc-900 border border-zinc-800 overflow-hidden">
                      {p.cover_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.cover_image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-700 text-lg">✦</div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-1">
                        <h3 className="text-white text-sm font-light truncate">{p.title}</h3>
                        <span className={`flex-shrink-0 text-[10px] px-2 py-0.5 border ${p.published ? 'border-green-800 text-green-400' : 'border-zinc-700 text-zinc-500'}`}>
                          {p.published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      <p className="text-zinc-600 text-xs truncate mb-1">{p.excerpt}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {p.tags.map(t => (
                          <span key={t} className="text-[10px] border border-zinc-800 text-zinc-600 px-1.5 py-0.5">{t}</span>
                        ))}
                        <span className="text-zinc-700 text-[10px]">{formatDate(p.created_at)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <button onClick={() => openEdit(p)} className="text-[10px] uppercase tracking-widest border border-zinc-700 text-zinc-400 px-3 py-1.5 hover:border-white hover:text-white transition-colors">
                        Edit
                      </button>
                      <button onClick={() => togglePublish(p)} className="text-[10px] uppercase tracking-widest border border-zinc-700 text-zinc-400 px-3 py-1.5 hover:border-white hover:text-white transition-colors">
                        {p.published ? 'Unpublish' : 'Publish'}
                      </button>
                      <button onClick={() => regenImageForPost(p.id, p.title)} className="text-[10px] uppercase tracking-widest border border-zinc-700 text-zinc-400 px-3 py-1.5 hover:border-white hover:text-white transition-colors">
                        New Image
                      </button>
                      <button onClick={() => deletePost(p)} className="text-[10px] uppercase tracking-widest border border-red-900 text-red-700 px-3 py-1.5 hover:border-red-500 hover:text-red-400 transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
