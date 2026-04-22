'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function CreatePostPage() {
  const [title, setTitle]         = useState('')
  const [body, setBody]           = useState('')
  const [imageUrl, setImageUrl]   = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [userId, setUserId]       = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const router   = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('users').select('role').eq('id', user.id).single()

      if (!profile || !['author', 'admin'].includes(profile.role)) {
        router.push('/')
        return
      }
      setUserId(user.id)
      setAuthChecked(true)
    }
    checkAuth()
  }, [])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setImageUrl('')
  }

  const uploadImage = async (file) => {
    const ext      = file.name.split('.').pop()
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('post-images').upload(filename, file)
    if (error) throw new Error('Image upload failed: ' + error.message)
    const { data: { publicUrl } } = supabase.storage.from('post-images').getPublicUrl(filename)
    return publicUrl
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 1. Upload image if a file was selected
      let finalImageUrl = imageUrl.trim()
      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile)
      }

      // 2. Generate AI summary (cost-optimised: called only once per post)
      let summary = ''
      try {
        const res  = await fetch('/api/generate-summary', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ title, body }),
        })
        const json = await res.json()
        summary    = json.summary || ''
      } catch (err) {
        console.warn('AI summary skipped:', err.message)
      }

      // 3. Insert post (summary stored once — never regenerated)
      const { data: post, error: insertError } = await supabase
        .from('posts')
        .insert({ title, body, image_url: finalImageUrl || null, author_id: userId, summary })
        .select()
        .single()

      if (insertError) throw new Error(insertError.message)
      router.push(`/posts/${post.id}`)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (!authChecked) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Post</h1>
      <p className="text-gray-500 mb-8 text-sm">
        An AI-generated summary will be created automatically when you publish.
      </p>

      {error && (
        <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Give your post a compelling title…"
          />
        </div>

        {/* Featured Image */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Featured Image</label>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition">
            <input
              type="file"
              id="imageFile"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="imageFile" className="cursor-pointer">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg object-cover" />
              ) : (
                <div className="py-4">
                  <div className="text-3xl mb-2">🖼️</div>
                  <p className="text-sm text-gray-500">Click to upload an image</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, WebP up to 10MB</p>
                </div>
              )}
            </label>
          </div>

          <div className="mt-2">
            <p className="text-xs text-gray-400 mb-1">Or paste an image URL:</p>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => { setImageUrl(e.target.value); setImageFile(null); setImagePreview('') }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/image.jpg"
            />
          </div>
        </div>

        {/* Body */}
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
            placeholder="Write your post content here…"
          />
          <p className="text-xs text-gray-400 mt-1">{body.length} characters</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-60 flex items-center gap-2 text-sm"
          >
            {loading ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Publishing…
              </>
            ) : '🚀 Publish Post'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-50 transition text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
