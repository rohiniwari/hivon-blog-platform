'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function Navbar() {
  const [user, setUser]       = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const router   = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  async function loadUser(authUser) {
    setUser(authUser)
    if (authUser) {
      const { data } = await supabase
        .from('users')
        .select('role, name')
        .eq('id', authUser.id)
        .single()
      setUserRole(data?.role ?? null)
      setUserName(data?.name ?? '')
    } else {
      setUserRole(null)
      setUserName('')
    }
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => loadUser(user))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      loadUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const canCreatePost = userRole === 'author' || userRole === 'admin'
  const isAdmin       = userRole === 'admin'

  const roleBadgeColor = {
    admin:  'bg-red-100 text-red-700',
    author: 'bg-green-100 text-green-700',
    viewer: 'bg-gray-100 text-gray-600',
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-blue-600 tracking-tight">
          Hivon<span className="text-gray-900">Blog</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/"
            className={`text-sm font-medium transition ${pathname === '/' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Home
          </Link>

          {!loading && (
            <>
              {canCreatePost && (
                <Link
                  href="/create-post"
                  className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  + New Post
                </Link>
              )}

              {isAdmin && (
                <Link
                  href="/admin"
                  className={`text-sm font-medium transition ${pathname === '/admin' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Admin
                </Link>
              )}

              {user ? (
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${roleBadgeColor[userRole] || 'bg-gray-100 text-gray-600'}`}>
                    {userRole}
                  </span>
                  <span className="text-sm text-gray-700 font-medium">{userName}</span>
                  <button
                    onClick={handleSignOut}
                    className="text-sm text-gray-500 hover:text-red-600 transition"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <>
                  <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="border border-blue-600 text-blue-600 text-sm px-4 py-2 rounded-lg hover:bg-blue-50 transition font-medium"
                  >
                    Register
                  </Link>
                </>
              )}
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
          <Link href="/" onClick={() => setMenuOpen(false)} className="block text-sm text-gray-700">Home</Link>
          {canCreatePost && (
            <Link href="/create-post" onClick={() => setMenuOpen(false)} className="block text-sm text-blue-600 font-medium">+ New Post</Link>
          )}
          {isAdmin && (
            <Link href="/admin" onClick={() => setMenuOpen(false)} className="block text-sm text-gray-700">Admin Dashboard</Link>
          )}
          {user ? (
            <button onClick={handleSignOut} className="block text-sm text-red-500">Sign Out</button>
          ) : (
            <>
              <Link href="/login" onClick={() => setMenuOpen(false)} className="block text-sm text-gray-700">Login</Link>
              <Link href="/register" onClick={() => setMenuOpen(false)} className="block text-sm text-blue-600 font-medium">Register</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
