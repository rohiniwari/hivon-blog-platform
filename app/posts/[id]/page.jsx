'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import CommentSection from '@/components/CommentSection'

export default function PostDetailPage() {
  const { id }     = useParams()
  const router     = useRouter()
  const [post, setPost]               = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [userRole, setUserRole]       = useState(null)
  const [loading, setLoading]         = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const [
        { data: post },
        { data: { user } },
      ] = await Promise.all([
        supabase
          .from('posts')
          .select('*, users(id, name)')
          .eq('id', id)
          .single(),
        supabase.auth.getUser(),
      ])

      if (!post) { router.push('/'); return }
      setPost(post)
      setCurrentUser(user)

      if (user) {
        const { data: profile } = await supabase
          .from('users').select('role').eq('id', user.id).single()
        setUserRole(profile?.role ?? null)
      }

      setLoading(false)
    }
    load()
  }, [id])

  const canEdit =
    currentUser &&
    (userRole === 'admin' ||
      (userRole === 'author' && post?.author_id === currentUser.id))

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-24" />
        <div className="h-10 bg-gray-200 rounded w-3/4" />
        <div className="h-64 bg-gray-200 rounded-xl" />
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => <div key={i} className="h-4 bg-gray-200 rounded" />)}
        </div>
      </div>
    )
  }

  if (!post) return null

  const date = new Date(post.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/" className="text-blue-600 hover:underline text-sm inline-flex items-center gap-1">
          ← Back to all posts
        </Link>
      </div>

      <article className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Featured image */}
        {post.image_url && (
          <div className="w-full h-72 overflow-hidden bg-gray-100">
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.parentElement.style.display = 'none' }}
            />
          </div>
        )}

        <div className="p-6 md:p-10">
          {/* Author + date + edit */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                {post.users?.name?.[0]?.toUpperCase() || 'A'}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{post.users?.name || 'Anonymous'}</p>
                <p className="text-xs text-gray-400">{date}</p>
              </div>
            </div>

            {canEdit && (
              <Link
                href={`/posts/${post.id}/edit`}
                className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition font-medium"
              >
                ✏️ Edit Post
              </Link>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-6 leading-tight">{post.title}</h1>

          {/* AI Summary box */}
          {post.summary && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-xl p-5 mb-8">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-purple-600 text-sm font-semibold">✨ AI-Generated Summary</span>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">{post.summary}</p>
            </div>
          )}

          {/* Post body */}
          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-[15px]">
            {post.body}
          </div>
        </div>
      </article>

      {/* Comments */}
      <div className="mt-8">
        <CommentSection
          postId={id}
          currentUser={currentUser}
          userRole={userRole}
        />
      </div>
    </div>
  )
}
