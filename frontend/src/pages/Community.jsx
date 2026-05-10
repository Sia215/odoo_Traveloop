import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Heart, MessageCircle, Copy, Share2, MapPin, ChevronDown, SlidersHorizontal, X, Globe, Lock, Send, Plus } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useUser } from '../context/UserContext'
import Navbar from '../components/Navbar'
import CreatePostModal from '../components/CreatePostModal'
import toast from 'react-hot-toast'

const CATEGORIES = ['All', 'General', 'Trip Review', 'Tips', 'Food', 'Adventure', 'Budget Travel']

const API = import.meta.env.VITE_API_URL

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  return { Authorization: `Bearer ${session?.access_token}` }
}

const TAG_COLORS = {
  Adventure: 'bg-orange-100 text-orange-700',
  Budget:    'bg-green-100 text-green-700',
  Luxury:    'bg-purple-100 text-purple-700',
  Family:    'bg-blue-100 text-blue-700',
  Solo:      'bg-pink-100 text-pink-700',
  Beach:     'bg-cyan-100 text-cyan-700',
  Mountain:  'bg-slate-100 text-slate-700',
  City:      'bg-yellow-100 text-yellow-700',
  Cultural:  'bg-red-100 text-red-700',
  Food:      'bg-lime-100 text-lime-700',
}

const TAGS = Object.keys(TAG_COLORS)

function Avatar({ url, name = '?', size = 8 }) {
  const initials = name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
  return url
    ? <img src={url} alt={name} className={`w-${size} h-${size} rounded-full object-cover shrink-0`} />
    : <div className={`w-${size} h-${size} rounded-full bg-primary flex items-center justify-center shrink-0`}>
        <span className="text-white text-xs font-bold">{initials}</span>
      </div>
}

function TagBadge({ tag }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TAG_COLORS[tag] || 'bg-slate-100 text-slate-600'}`}>
      {tag}
    </span>
  )
}

function PostCard({ post, selected, onSelect, onLike, likedIds }) {
  const liked = likedIds.has(post.id)
  const name = post.profile ? `${post.profile.first_name ?? ''} ${post.profile.last_name ?? ''}`.trim() : 'Anonymous'
  return (
    <div
      onClick={() => onSelect(post)}
      className={`relative bg-white rounded-xl border cursor-pointer transition-all duration-200 p-4 group
        ${selected ? 'border-primary bg-teal-50/60 shadow-md' : 'border-slate-200 hover:shadow-md hover:border-slate-300'}`}
    >
      {selected && <div className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full" />}
      <div className="flex items-start gap-3">
        <input type="radio" readOnly checked={selected} className="mt-1 accent-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Avatar url={post.profile?.avatar_url} name={name} size={7} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-dark truncate">{name}</p>
              <p className="text-xs text-slate-400">{new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </div>
          </div>
          <h3 className="font-semibold text-dark text-sm mb-1 line-clamp-1">{post.title}</h3>
          <p className="text-xs text-slate-500 line-clamp-2 mb-2">{post.content}</p>
          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {post.tags.slice(0, 3).map(t => <TagBadge key={t} tag={t} />)}
            </div>
          )}
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <button
              onClick={e => { e.stopPropagation(); onLike(post.id) }}
              className={`flex items-center gap-1 transition-colors ${liked ? 'text-red-500' : 'hover:text-red-400'}`}
            >
              <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-red-500' : ''}`} />
              {post.like_count}
            </button>
            <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />{post.comment_count}</span>
            <span className="flex items-center gap-1"><Copy className="w-3.5 h-3.5" />{post.copy_count}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="w-20 h-20 rounded-full bg-teal-50 flex items-center justify-center mb-4">
        <Globe className="w-10 h-10 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-dark mb-1">No community posts yet</h3>
      <p className="text-slate-400 text-sm">Be the first to share your trip!</p>
    </div>
  )
}

function DetailPanel({ post, comments, loadingComments, user, onLike, onComment, onCopy, onShare, likedIds, onClose }) {
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const liked = likedIds.has(post.id)
  const name = post.profile ? `${post.profile.first_name ?? ''} ${post.profile.last_name ?? ''}`.trim() : 'Anonymous'

  const submit = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    setSubmitting(true)
    await onComment(newComment.trim())
    setNewComment('')
    setSubmitting(false)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 flex flex-col h-full animate-slide-in overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <Avatar url={post.profile?.avatar_url} name={name} size={10} />
            <div>
              <p className="font-semibold text-dark">{name}</p>
              <p className="text-xs text-slate-400">{new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
              <Lock className="w-3 h-3" /> Read-only
            </span>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 md:hidden">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <h2 className="text-xl font-bold text-dark mb-2">{post.title}</h2>
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.map(t => <TagBadge key={t} tag={t} />)}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Content */}
        <div className="p-5 border-b border-slate-100">
          <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
        </div>

        {/* Trip Summary */}
        {post.trips && (
          <div className="mx-5 my-4 bg-teal-50 rounded-xl p-4 border border-teal-100">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">Linked Trip</p>
            <p className="font-semibold text-dark">{post.trips.name}</p>
            {post.trips.start_date && post.trips.end_date && (
              <p className="text-xs text-slate-500 mt-1">
                {Math.ceil((new Date(post.trips.end_date) - new Date(post.trips.start_date)) / 86400000)} days
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="px-5 pb-4 flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onLike(post.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border
              ${liked ? 'bg-red-50 text-red-500 border-red-200' : 'bg-white text-slate-600 border-slate-200 hover:border-red-200 hover:text-red-400'}`}
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-red-500' : ''}`} />
            {liked ? 'Liked' : 'Like'} · {post.like_count}
          </button>
          <button
            onClick={onCopy}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-primary text-white hover:bg-teal-700 transition-all"
          >
            <Copy className="w-4 h-4" /> Copy This Trip
          </button>
          <button
            onClick={onShare}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all"
          >
            <Share2 className="w-4 h-4" /> Share
          </button>
        </div>

        {/* Comments */}
        <div className="px-5 pb-5 border-t border-slate-100 pt-4">
          <p className="font-semibold text-dark mb-3 text-sm">Comments · {post.comment_count}</p>

          {user ? (
            <form onSubmit={submit} className="flex gap-2 mb-4">
              <Avatar url={user.avatar_url} name={`${user.first_name} ${user.last_name}`} size={8} />
              <div className="flex-1 flex items-center gap-2 bg-slate-50 rounded-xl px-3 border border-slate-200 focus-within:border-primary transition-colors">
                <input
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 py-2.5 text-sm bg-transparent outline-none text-dark placeholder-slate-400"
                />
                <button type="submit" disabled={submitting || !newComment.trim()} className="text-primary disabled:opacity-40">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-sm text-amber-700">
              <a href="/login" className="font-semibold underline">Login</a> to like, comment, and copy trips.
            </div>
          )}

          {loadingComments ? (
            <div className="space-y-3">
              {[1,2].map(i => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : comments.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-4">No comments yet. Be the first!</p>
          ) : (
            <div className="space-y-3">
              {comments.map(c => {
                const cName = c.profile ? `${c.profile.first_name ?? ''} ${c.profile.last_name ?? ''}`.trim() : 'Anonymous'
                return (
                  <div key={c.id} className="flex gap-2.5">
                    <Avatar url={c.profile?.avatar_url} name={cName} size={7} />
                    <div className="flex-1 bg-slate-50 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-dark">{cName}</span>
                        <span className="text-xs text-slate-400">{new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-slate-600">{c.content}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Community() {
  const { user } = useUser()
  const [posts, setPosts] = useState([])
  const [selectedPost, setSelectedPost] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [activeCategory, setActiveCategory] = useState('All')
  const [comments, setComments] = useState([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [search, setSearch] = useState('')
  const [tag, setTag] = useState('')
  const [sort, setSort] = useState('most_recent')
  const [likedIds, setLikedIds] = useState(new Set())
  const [showMobileDetail, setShowMobileDetail] = useState(false)
  const observerRef = useRef()
  const realtimeRef = useRef()

  const sortMap = { most_recent: 'recent', most_liked: 'liked', most_commented: 'commented', most_copied: 'copied' }
  const pageRef = useRef(1)
  const searchRef = useRef(search)
  const tagRef = useRef(tag)
  const sortRef = useRef(sort)
  const categoryRef = useRef(activeCategory)

  const fetchPosts = useCallback(async (reset = false) => {
    if (reset) { setLoading(true); pageRef.current = 1 }
    else setLoadingMore(true)
    try {
      const p = pageRef.current
      const params = new URLSearchParams({ page: p, limit: 10, sort: sortMap[sortRef.current] })
      if (searchRef.current) params.set('search', searchRef.current)
      if (tagRef.current) params.set('tag', tagRef.current)
      if (categoryRef.current && categoryRef.current !== 'All') params.set('category', categoryRef.current)
      const res = await fetch(`${API}/api/community?${params}`)
      const data = await res.json()
      if (data.success) {
        setPosts(prev => reset ? data.posts : [...prev, ...data.posts])
        setHasMore(data.posts.length === 10)
        pageRef.current = p + 1
      }
    } catch { toast.error('Failed to load posts') }
    finally { setLoading(false); setLoadingMore(false) }
  }, [])

  // reset on filter change
  useEffect(() => {
    searchRef.current = search
    tagRef.current = tag
    sortRef.current = sort
    categoryRef.current = activeCategory
    fetchPosts(true)
  }, [search, tag, sort, activeCategory, fetchPosts])

  // infinite scroll
  const hasMoreRef = useRef(hasMore)
  const loadingMoreRef = useRef(loadingMore)
  const loadingRef = useRef(loading)
  useEffect(() => { hasMoreRef.current = hasMore }, [hasMore])
  useEffect(() => { loadingMoreRef.current = loadingMore }, [loadingMore])
  useEffect(() => { loadingRef.current = loading }, [loading])

  useEffect(() => {
    const el = observerRef.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasMoreRef.current && !loadingMoreRef.current && !loadingRef.current) fetchPosts()
    }, { threshold: 0.5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [fetchPosts])

  const fetchComments = async (postId) => {
    setLoadingComments(true)
    try {
      const res = await fetch(`${API}/api/community/${postId}/comments`)
      const data = await res.json()
      if (data.success) setComments(data.comments)
    } catch { toast.error('Failed to load comments') }
    finally { setLoadingComments(false) }
  }

  const handleSelect = (post) => {
    setSelectedPost(post)
    fetchComments(post.id)
    setShowMobileDetail(true)

    // realtime subscription for comments
    if (realtimeRef.current) supabase.removeChannel(realtimeRef.current)
    realtimeRef.current = supabase
      .channel(`comments:${post.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_comments', filter: `post_id=eq.${post.id}` },
        payload => setComments(prev => prev.find(c => c.id === payload.new.id) ? prev : [...prev, { ...payload.new, profile: null }])
      )
      .subscribe()
  }

  useEffect(() => () => { if (realtimeRef.current) supabase.removeChannel(realtimeRef.current) }, [])

  const handleLike = async (postId) => {
    if (!user) { toast.error('Login to like posts'); return }
    const headers = await authHeaders()
    try {
      const res = await fetch(`${API}/api/community/${postId}/like`, { method: 'POST', headers })
      const data = await res.json()
      if (data.success) {
        setLikedIds(prev => { const s = new Set(prev); data.liked ? s.add(postId) : s.delete(postId); return s })
        const delta = data.liked ? 1 : -1
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, like_count: p.like_count + delta } : p))
        setSelectedPost(prev => prev?.id === postId ? { ...prev, like_count: prev.like_count + delta } : prev)
      }
    } catch { toast.error('Failed to toggle like') }
  }

  const handleComment = async (content) => {
    if (!user) return
    const headers = { ...(await authHeaders()), 'Content-Type': 'application/json' }
    try {
      const res = await fetch(`${API}/api/community/${selectedPost.id}/comment`, { method: 'POST', headers, body: JSON.stringify({ content }) })
      const data = await res.json()
      if (data.success) {
        setComments(prev => [...prev, data.comment])
        setPosts(prev => prev.map(p => p.id === selectedPost.id ? { ...p, comment_count: p.comment_count + 1 } : p))
        setSelectedPost(prev => ({ ...prev, comment_count: prev.comment_count + 1 }))
        toast.success('Comment posted!')
      }
    } catch { toast.error('Failed to post comment') }
  }

  const handleCopy = async () => {
    if (!user) { toast.error('Login to copy trips'); return }
    const headers = await authHeaders()
    try {
      const res = await fetch(`${API}/api/community/${selectedPost.id}/copy`, { method: 'POST', headers })
      const data = await res.json()
      if (data.success) {
        toast.success('Trip copied to your account!')
        setPosts(prev => prev.map(p => p.id === selectedPost.id ? { ...p, copy_count: p.copy_count + 1 } : p))
        setSelectedPost(prev => ({ ...prev, copy_count: prev.copy_count + 1 }))
      } else toast.error(data.message || 'Failed to copy trip')
    } catch { toast.error('Failed to copy trip') }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/community?post=${selectedPost.id}`)
    toast.success('Link copied to clipboard!')
  }

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev])
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <div className="relative bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-400 overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10" />
        <div className="absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-white/10" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-start justify-between mb-1">
            <h1 className="text-3xl font-bold text-white">Community</h1>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-[#F97316] hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow-sm"
            >
              <Plus size={16} /> Share Experience
            </button>
          </div>
          <p className="text-teal-100 text-sm mb-6">Share your travel experiences with fellow travelers</p>

          {/* Search + Filter bar */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-white rounded-xl px-4 shadow-lg">
              <Search size={16} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search destinations, usernames, keywords..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 py-3 text-sm text-dark placeholder-slate-400 outline-none bg-transparent"
              />
              {search && <button onClick={() => setSearch('')}><X size={14} className="text-slate-400" /></button>}
            </div>

            <div className="flex items-center gap-1 bg-white rounded-xl px-3 shadow-lg">
              <SlidersHorizontal size={14} className="text-slate-400" />
              <select value={tag} onChange={e => setTag(e.target.value)} className="py-3 text-sm text-slate-600 outline-none bg-transparent pr-1">
                <option value="">All Tags</option>
                {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-1 bg-white rounded-xl px-3 shadow-lg">
              <ChevronDown size={14} className="text-slate-400" />
              <select value={sort} onChange={e => setSort(e.target.value)} className="py-3 text-sm text-slate-600 outline-none bg-transparent pr-1">
                <option value="most_recent">Most Recent</option>
                <option value="most_liked">Most Liked</option>
                <option value="most_commented">Most Commented</option>
                <option value="most_copied">Most Copied</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-[13px] font-medium transition border
                  ${activeCategory === cat
                    ? 'bg-[#0D9488] text-white border-[#0D9488]'
                    : 'bg-white text-[#1E293B] border-slate-200 hover:border-[#0D9488] hover:text-[#0D9488]'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">

          {/* Left: Post list */}
          <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 lg:h-[calc(100vh-220px)] lg:overflow-y-auto lg:pr-1 scrollbar-hide">
            {loading ? (
              <div className="space-y-3">
                {[1,2,3,4].map(i => <div key={i} className="h-36 bg-white rounded-xl border border-slate-200 animate-pulse" />)}
              </div>
            ) : posts.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-3">
                {posts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    selected={selectedPost?.id === post.id}
                    onSelect={handleSelect}
                    onLike={handleLike}
                    likedIds={likedIds}
                  />
                ))}
                <div ref={observerRef} className="h-4 flex items-center justify-center">
                  {loadingMore && <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
                </div>
              </div>
            )}
          </div>

          {/* Right: Detail panel — desktop */}
          <div className="hidden lg:flex flex-1 lg:h-[calc(100vh-220px)]">
            {selectedPost ? (
              <div className="w-full">
                <DetailPanel
                  post={selectedPost}
                  comments={comments}
                  loadingComments={loadingComments}
                  user={user}
                  onLike={handleLike}
                  onComment={handleComment}
                  onCopy={handleCopy}
                  onShare={handleShare}
                  likedIds={likedIds}
                  onClose={() => setSelectedPost(null)}
                />
              </div>
            ) : (
              <div className="flex-1 bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center p-12">
                <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mb-4">
                  <MapPin className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-dark mb-1">Select a post</h3>
                <p className="text-slate-400 text-sm">Click any card on the left to view full details.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile: bottom sheet detail panel */}
      {showMobileDetail && selectedPost && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobileDetail(false)} />
          <div className="relative bg-white rounded-t-2xl max-h-[85vh] flex flex-col">
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mt-3 mb-1 shrink-0" />
            <div className="flex-1 overflow-hidden">
              <DetailPanel
                post={selectedPost}
                comments={comments}
                loadingComments={loadingComments}
                user={user}
                onLike={handleLike}
                onComment={handleComment}
                onCopy={handleCopy}
                onShare={handleShare}
                likedIds={likedIds}
                onClose={() => setShowMobileDetail(false)}
              />
            </div>
          </div>
        </div>
      )}

      <CreatePostModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onPostCreated={handlePostCreated}
      />
    </div>
  )
}
