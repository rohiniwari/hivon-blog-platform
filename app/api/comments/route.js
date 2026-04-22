import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// GET /api/comments?post_id=xxx
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const postId = searchParams.get('post_id')

  if (!postId) return NextResponse.json({ error: 'post_id is required' }, { status: 400 })

  const supabase = createClient()
  const { data, error } = await supabase
    .from('comments')
    .select('*, users(name)')
    .eq('post_id', postId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comments: data })
}

// POST /api/comments
export async function POST(request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { post_id, comment_text } = await request.json()
  if (!post_id || !comment_text?.trim()) {
    return NextResponse.json({ error: 'post_id and comment_text are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id, user_id: user.id, comment_text: comment_text.trim() })
    .select('*, users(name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comment: data }, { status: 201 })
}
