import { useState } from 'react'
import { Heart, Trash2, MapPin } from 'lucide-react'

const CATEGORY_COLORS = {
  'General':       'bg-slate-100 text-slate-600',
  'Trip Review':   'bg-teal-50 text-[#0D9488]',
  'Tips':          'bg-blue-50 text-blue-600',
  'Food':          'bg-orange-50 text-[#F97316]',
  'Adventure':     'bg-red-50 text-red-600',
  'Budget Travel': 'bg-green-50 text-green-600',
}

function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins} minute${mins !== 1 ? 's' : ''} ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`
  const days = Math.floor(hrs / 24)
  if (days < 7)   return `${days} day${days !== 1 ? 's' : ''} ago`
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function PostCard({ post, isLiked, isOwner, onLike, onDelete }) {
  const [expanded, setExpanded]       = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const name = post.first_name || post.last_name
    ? `${post.first_name ?? ''} ${post.last_name ?? ''}`.trim()
    : post.profile
      ? `${post.profile.first_name ?? ''} ${post.profile.last_name ?? ''}`.trim()
      : 'Anonymous'

  const avatarUrl = post.avatar_url ?? post.profile?.avatar_url
  const initials  = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
  const category  = post.category || 'General'
  const likeCount = post.likes_count ?? post.like_count ?? 0
  const tripName  = post.trip_name ?? post.trips?.name

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow duration-150">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          {avatarUrl
            ? <img src={avatarUrl} alt={name} className="w-10 h-10 rounded-full object-cover shrink-0" />
            : <div className="w-10 h-10 rounded-full bg-[#0D9488] flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">{initials}</span>
              </div>
          }
          <div>
            <p className="text-sm font-semibold text-[#1E293B]">{name}</p>
            <p className="text-xs text-slate-400">{relativeTime(post.created_at)}</p>
          </div>
        </div>
        <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full shrink-0 ${CATEGORY_COLORS[category] ?? CATEGORY_COLORS['General']}`}>
          {category}
        </span>
      </div>

      {/* Title + content */}
      <h3 className="font-semibold text-[#1E293B] text-sm mb-1">{post.title}</h3>
      <p className={`text-xs text-slate-500 leading-relaxed ${expanded ? '' : 'line-clamp-3'}`}>
        {post.content}
      </p>
      {post.content?.length > 180 && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-xs text-[#0D9488] font-medium mt-0.5 hover:underline"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}

      {/* Linked trip */}
      {tripName && (
        <div className="flex items-center gap-1.5 mt-2 text-xs text-[#0D9488]">
          <MapPin size={12} />
          <span>Linked to: {tripName}</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
        <button
          onClick={() => onLike(post.id)}
          className={`flex items-center gap-1.5 text-xs font-medium transition-colors
            ${isLiked ? 'text-[#0D9488]' : 'text-slate-400 hover:text-[#0D9488]'}`}
        >
          <Heart size={14} className={isLiked ? 'fill-[#0D9488]' : ''} />
          {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
        </button>

        {isOwner && (
          confirmDelete ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Delete?</span>
              <button onClick={() => onDelete(post.id)} className="text-[#EF4444] font-semibold hover:underline">Yes</button>
              <button onClick={() => setConfirmDelete(false)} className="text-slate-400 hover:underline">Cancel</button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-slate-400 hover:text-[#EF4444] transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )
        )}
      </div>
    </div>
  )
}
