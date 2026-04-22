'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

const ROLE_COLORS = {
  admin:  'bg-red-100 text-red-700',
  author: 'bg-green-100 text-green-700',
  viewer: 'bg-gray-100 text-gray-600',
}

export default function AdminPage() {
  const [posts, setPosts]       = useState([])
  const [comments, setComments] = useState([])
  const [users, setUsers]       = useState([])
  const [tab, setTab]           = useState('posts')
  const [loading, setLoading]   = useState(true)
  const router   = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadAdmin() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('users').select('role').eq('id', user.id).single()

      if (profile?.role !== 'admin') { router.push('/'); return }

      const [{ data: posts }, { data: comments }, { data: users }] = await Promise.all([
        supabase.from('posts').select('id, title, created_at, users(name)').order('created_at', { ascending: false }),
        supabase.from('comments').select('id, comment_text, created_at, users(name), posts(title)').order('created_at', { ascending: false }),
        supabase.from('users').select('*').order('created_at', { ascending: false }),
      ])

      setPosts(posts || [])
      setComments(comments || [])
      setUsers(users || [])
      setLoading(false)
    }
    loadAdmin()
  }, [])

  const deletePost = async (postId) => {
    if (!confirm('Delete this post and all its comments?')) return
    await supabase.from('posts').delete().eq('id', postId)
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  const deleteComment = async (commentId) => {
    if (!confirm('Delete this comment?')) return
    await supabase.from('comments').delete().eq('id', commentId)
    setComments(prev => prev.filter(c => c.id !== commentId))
  }

  const changeRole = async (userId, newRole) => {
    await supabase.from('users').update({ role: newRole }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  const tabs = [
    { key: 'posts',    label: 'Posts',    count: posts.length,    emoji: '📝' },
    { key: 'comments', label: 'Comments', count: comments.length, emoji: '💬' },
    { key: 'users',    label: 'Users',    count: users.length,    emoji: '👥' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm">Manage all content and users on the platform.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {tabs.map(t => (
          <div key={t.key} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl mb-1">{t.emoji}</div>
            <div className="text-2xl font-bold text-gray-900">{t.count}</div>
            <div className="text-xs text-gray-500 font-medium">{t.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              tab === t.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.emoji} {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* Posts tab */}
      {tab === 'posts' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-gray-600 font-semibold">Title</th>
                  <th className="px-4 py-3 text-gray-600 font-semibold">Author</th>
                  <th className="px-4 py-3 text-gray-600 font-semibold">Date</th>
                  <th className="px-4 py-3 text-gray-600 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {posts.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No posts yet.</td></tr>
                ) : posts.map(post => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-xs">
                      <span className="line-clamp-2">{post.title}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{post.users?.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {new Date(post.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex gap-3">
                        <Link href={`/posts/${post.id}`} className="text-blue-600 hover:underline text-xs font-medium">
                          View
                        </Link>
                        <Link href={`/posts/${post.id}/edit`} className="text-green-600 hover:underline text-xs font-medium">
                          Edit
                        </Link>
                        <button onClick={() => deletePost(post.id)} className="text-red-500 hover:underline text-xs font-medium">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Comments tab */}
      {tab === 'comments' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-gray-600 font-semibold">Comment</th>
                  <th className="px-4 py-3 text-gray-600 font-semibold">By</th>
                  <th className="px-4 py-3 text-gray-600 font-semibold">On Post</th>
                  <th className="px-4 py-3 text-gray-600 font-semibold">Date</th>
                  <th className="px-4 py-3 text-gray-600 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {comments.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No comments yet.</td></tr>
                ) : comments.map(comment => (
                  <tr key={comment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700 max-w-xs">
                      <span className="line-clamp-2">{comment.comment_text}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{comment.users?.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[160px]">
                      <span className="line-clamp-1">{comment.posts?.title || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => deleteComment(comment.id)} className="text-red-500 hover:underline text-xs font-medium">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Users tab */}
      {tab === 'users' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-gray-600 font-semibold">Name</th>
                  <th className="px-4 py-3 text-gray-600 font-semibold">Email</th>
                  <th className="px-4 py-3 text-gray-600 font-semibold">Role</th>
                  <th className="px-4 py-3 text-gray-600 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={(e) => changeRole(u.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-full font-semibold border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${ROLE_COLORS[u.role]}`}
                      >
                        <option value="viewer">Viewer</option>
                        <option value="author">Author</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
