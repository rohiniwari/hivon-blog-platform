'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import PostCard from '@/components/PostCard'
import SearchBar from '@/components/SearchBar'
import Pagination from '@/components/Pagination'

const POSTS_PER_PAGE = 6

export default function HomePage() {
  const [posts, setPosts]               = useState([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [currentPage, setCurrentPage]   = useState(1)
  const [totalCount, setTotalCount]     = useState(0)
  const supabase = createClient()

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    const from = (currentPage - 1) * POSTS_PER_PAGE
    const to   = from + POSTS_PER_PAGE - 1

    let query = supabase
      .from('posts')
      .select('id, title, body, image_url, summary, created_at, users(name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (search.trim()) {
      query = query.ilike('title', `%${search.trim()}%`)
    }

    const { data, error, count } = await query
    if (!error) {
      setPosts(data || [])
      setTotalCount(count || 0)
    }
    setLoading(false)
  }, [currentPage, search])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  // Reset to page 1 on new search
  useEffect(() => { setCurrentPage(1) }, [search])

  const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE)

  return (
    <div>
      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Latest Posts</h1>
        <p className="text-gray-500 text-lg">Discover stories, ideas, and expertise from our community.</p>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <SearchBar value={search} onChange={setSearch} />
        {totalCount > 0 && (
          <span className="text-sm text-gray-400 shrink-0">
            {totalCount} post{totalCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Posts grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-48 bg-gray-200 rounded-lg mb-4" />
              <div className="h-3 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-5 bg-gray-200 rounded w-5/6 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-4/5 mb-1" />
              <div className="h-4 bg-gray-200 rounded w-3/5" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-5xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {search ? 'No posts match your search' : 'No posts yet'}
          </h3>
          <p className="text-gray-400 text-sm">
            {search ? 'Try a different search term.' : 'Be the first to write something!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  )
}
