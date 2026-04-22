import Link from 'next/link'

export default function PostCard({ post }) {
  const date = new Date(post.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })

  // Strip any HTML tags from body for preview
  const preview = (post.summary || post.body?.replace(/<[^>]+>/g, '') || '')
    .slice(0, 160)
    .trim()

  return (
    <article className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      {post.image_url && (
        <div className="h-48 overflow-hidden bg-gray-100">
          <img
            src={post.image_url}
            alt={post.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            onError={(e) => { e.target.parentElement.style.display = 'none' }}
          />
        </div>
      )}

      <div className="p-5 flex flex-col flex-1">
        {/* Meta */}
        <div className="flex items-center gap-2 mb-2 text-xs text-gray-400">
          <span>{date}</span>
          <span>•</span>
          <span className="text-blue-600 font-medium">{post.users?.name || 'Anonymous'}</span>
          {post.summary && (
            <>
              <span>•</span>
              <span className="bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded text-xs font-medium">
                AI Summary
              </span>
            </>
          )}
        </div>

        {/* Title */}
        <h2 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2 leading-snug">
          {post.title}
        </h2>

        {/* Summary / Preview */}
        <p className="text-gray-500 text-sm line-clamp-3 mb-4 flex-1">
          {preview}{preview.length === 160 ? '...' : ''}
        </p>

        <Link
          href={`/posts/${post.id}`}
          className="inline-flex items-center gap-1 text-blue-600 text-sm font-medium hover:gap-2 transition-all"
        >
          Read more →
        </Link>
      </div>
    </article>
  )
}
