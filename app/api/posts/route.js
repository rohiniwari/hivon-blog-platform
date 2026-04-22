import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// GET /api/posts?search=&page=1&limit=6
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const page   = parseInt(searchParams.get('page') || '1', 10)
  const limit  = parseInt(searchParams.get('limit') || '6', 10)
  const from   = (page - 1) * limit
  const to     = from + limit - 1

  const supabase = createClient()

  let query = supabase
    .from('posts')
    .select('id, title, body, image_url, summary, created_at, users(name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (search) query = query.ilike('title', `%${search}%`)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ posts: data, total: count })
}

// POST /api/posts  — handled client-side via Supabase SDK (RLS enforced)
// This endpoint is kept for potential server-side use or testing
export async function POST(request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single()

  if (!['author', 'admin'].includes(profile?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { title, body: content, image_url, summary } = body

  if (!title || !content) {
    return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({ title, body: content, image_url: image_url || null, author_id: user.id, summary: summary || '' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ post: data }, { status: 201 })
}
