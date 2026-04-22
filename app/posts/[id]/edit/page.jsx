'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function EditPostPage() {
  const { id }   = useParams()
  const router   = useRouter()
  const supabase = createClient()

  const [title, setTitle]       = useState('')
  const [body, setBody]         = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [{ data: post }, { data: profile }] = await Promise.all([
        supabase.from('posts').select('*').eq('id', id).single(),
        supabase.from('users').select('role').eq('id', user.id).single(),
      ])

      if (!post) { router.push('/'); return }

      const canEdit =
        profile?.role === 'admin' ||
        (profile?.role === 'author' && post.author_id === user.id)

      if (!canEdit) { router.push(`/posts/${id}`); return }

      setTitle(post.title)
      setBody(post.body)
      setImageUrl(post.image_url || '')
      setAuthorized(true)
    }
    load()
  }, [id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase
      .from('posts')
      .update({
        title,
        body,
        image_url:  imageUrl.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push(`/posts/${id}`)
    }
  }

  if (!authorized) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href={`/posts/${id}`} className="text-blue-600 hover:underline text-sm">
          ← Back to post
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Post</h1>
      <p className="text-gray-500 text-sm mb-8">Changes are saved immediately. The AI summary will not be regenerated.</p>

      {error && (
        <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Featured Image URL</label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/image.jpg"
          />
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Preview"
              className="mt-2 h-32 rounded-lg object-cover"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Content <span className="text-red-500">*</span>
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={14}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y font-mono"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-60 text-sm"
          >
            {loading ? 'Saving…' : '💾 Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/posts/${id}`)}
            className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-50 transition text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
