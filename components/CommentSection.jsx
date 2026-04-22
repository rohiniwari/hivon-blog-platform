'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function CommentSection({ postId, currentUser, userRole }) {
  const [comments, setComments]           = useState([])
  const [newComment, setNewComment]       = useState('')
  const [submitting, setSubmitting]       = useState(false)
  const [fetchingComments, setFetchingComments] = useState(true)
  const supabase = createClient()

  const fetchComments = useCallback(async () => {
    const { data } = await supabase
      .from('comments')
      .select('*, users(name)')
      .eq('post_id', postId)
      .order('created_at', { ascending: false })
    setComments(data || [])
    setFetchingComments(false)
  }, [postId])

  useEffect(() => { fetchComments() }, [fetchComments])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!newComment.trim()) return
    setSubmitting(true)

    const { error } = await supabase.from('comments').insert({
      post_id:      postId,
      user_id:      currentUser.id,
      comment_text: newComment.trim(),
    })

    if (!error) {
      setNewComment('')
      fetchComments()
    }
    setSubmitting(false)
  }

  async function handleDelete(commentId) {
    if (!window.confirm('Delete this comment?')) return
    await supabase.from('comments').delete().eq('id', commentId)
    setComments(prev => prev.filter(c => c.id !== commentId))
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        💬 Comments
        <span className="text-base font-normal text-gray-400">({comments.length})</span>
      </h2>

      {/* Comment input */}
      {currentUser ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="bg-blue-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium"
            >
              {submitting ? 'Posting…' : 'Post Comment'}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-center text-gray-500 text-sm border border-gray-200">
          <Link href="/login" className="text-blue-600 font-medium hover:underline">Log in</Link> to leave a comment
        </div>
      )}

      {/* Comments list */}
      {fetchingComments ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-1/4" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center text-gray-400 py-6 text-sm">
          No comments yet — start the conversation!
        </p>
      ) : (
        <div className="space-y-5">
          {comments.map(comment => {
            const canDelete =
              currentUser &&
              (comment.user_id === currentUser.id || userRole === 'admin')

            return (
              <div key={comment.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-blue-600 text-xs font-bold">
                  {comment.users?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-800">
                      {comment.users?.name || 'Anonymous'}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">
                        {new Date(comment.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </span>
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="text-xs text-red-400 hover:text-red-600 transition"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">{comment.comment_text}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
