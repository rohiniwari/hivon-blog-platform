import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// GET /api/posts/[id]
export async function GET(request, { params }) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('posts')
    .select('*, users(id, name)')
    .eq('id', params.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  return NextResponse.json({ post: data })
}

// PUT /api/posts/[id]
export async function PUT(request, { params }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  const { data: post }    = await supabase.from('posts').select('author_id').eq('id', params.id).single()

  const canEdit =
    profile?.role === 'admin' ||
    (profile?.role === 'author' && post?.author_id === user.id)

  if (!canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { title, body: content, image_url } = body

  const { data, error } = await supabase
    .from('posts')
    .update({ title, body: content, image_url: image_url || null, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ post: data })
}

// DELETE /api/posts/[id]
export async function DELETE(request, { params }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabase.from('posts').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
