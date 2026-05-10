import { useState, useEffect, useRef } from 'react'
import { Search, Filter, Heart, MessageCircle, Copy, Share2, MapPin, Calendar, Users } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useUser } from '../context/UserContext'
import toast from 'react-hot-toast'

export default function Community() {
  const { user } = useUser()
  const [posts, setPosts] = useState([])
  const [selectedPost, setSelectedPost] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingComments, setLoadingComments] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [sortBy, setSortBy] = useState('most_recent')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const observerRef = useRef()

  const tags = ['Adventure', 'Budget', 'Luxury', 'Family', 'Solo', 'Beach', 'Mountain', 'City', 'Cultural', 'Food']

  // Fetch posts
  const fetchPosts = async (reset = false) => {
    try {
      const currentPage = reset ? 1 : page
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        sort: sortBy
      })

      if (searchTerm) params.append('search', searchTerm)
      if (selectedTag) params.append('tag', selectedTag)

      const response = await fetch(`/api/community?${params}`)
      const data = await response.json()

      if (data.success) {
        if (reset) {
          setPosts(data.posts)
          setPage(1)
        } else {
          setPosts(prev => [...prev, ...data.posts])
        }
        setHasMore(data.posts.length === 10)
        if (!reset) setPage(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
      toast.error('Failed to load community posts')
    } finally {
      setLoading(false)
    }
  }

  // Fetch comments for selected post
  const fetchComments = async (postId) => {
    setLoadingComments(true)
    try {
      const response = await fetch(`/api/community/${postId}/comments`)
      const data = await response.json()
      if (data.success) {
        setComments(data.comments)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
      toast.error('Failed to load comments')
    } finally {
      setLoadingComments(false)
    }
  }

  // Handle post selection
  const handlePostSelect = (post) => {
    setSelectedPost(post)
    fetchComments(post.id)
  }

  // Handle like toggle
  const handleLike = async (postId) => {
    if (!user) {
      toast.error('Please login to like posts')
      return
    }

    try {
      const response = await fetch(`/api/community/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.auth.getSession()}`
        }
      })

      const data = await response.json()
      if (data.success) {
        setPosts(prev => prev.map(post =>
          post.id === postId
            ? { ...post, like_count: data.liked ? post.like_count + 1 : post.like_count - 1 }
            : post
        ))
        if (selectedPost?.id === postId) {
          setSelectedPost(prev => ({
            ...prev,
            like_count: data.liked ? prev.like_count + 1 : prev.like_count - 1
          }))
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      toast.error('Failed to like post')
    }
  }

  // Handle comment submission
  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    if (!user || !newComment.trim()) return

    setSubmittingComment(true)
    try {
      const response = await fetch(`/api/community/${selectedPost.id}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.auth.getSession()}`
        },
        body: JSON.stringify({ content: newComment })
      })

      const data = await response.json()
      if (data.success) {
        setComments(prev => [...prev, data.comment])
        setNewComment('')
        setPosts(prev => prev.map(post =>
          post.id === selectedPost.id
            ? { ...post, comment_count: post.comment_count + 1 }
            : post
        ))
        setSelectedPost(prev => ({
          ...prev,
          comment_count: prev.comment_count + 1
        }))
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
      toast.error('Failed to add comment')
    } finally {
      setSubmittingComment(false)
    }
  }

  // Handle trip copy
  const handleCopyTrip = async () => {
    if (!user) {
      toast.error('Please login to copy trips')
      return
    }

    try {
      const response = await fetch(`/api/community/${selectedPost.id}/copy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabase.auth.getSession()}`
        }
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Trip copied to your account!')
        setPosts(prev => prev.map(post =>
          post.id === selectedPost.id
            ? { ...post, copy_count: post.copy_count + 1 }
            : post
        ))
        setSelectedPost(prev => ({
          ...prev,
          copy_count: prev.copy_count + 1
        }))
      }
    } catch (error) {
      console.error('Error copying trip:', error)
      toast.error('Failed to copy trip')
    }
  }

  // Infinite scroll setup
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchPosts()
        }
      },
      { threshold: 1.0 }
    )

    if (observerRef.current) {
      observer.observe(observerRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, loading])

  // Initial load and search/filter changes
  useEffect(() => {
    fetchPosts(true)
  }, [searchTerm, selectedTag, sortBy])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const truncateText = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Traveloop</h1>
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search destinations, usernames..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filter & Sort */}
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Tags</option>
                {tags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="most_recent">Most Recent</option>
                <option value="most_liked">Most Liked</option>
                <option value="most_commented">Most Commented</option>
                <option value="most_copied">Most Copied</option>
              </select>
            </div>
          </div>

          <h2 className="text-lg text-gray-600">Explore trips shared by travelers</h2>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Posts List */}
          <div className="lg:col-span-1 space-y-4">
            {loading && posts.length === 0 ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading posts...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No community posts yet</h3>
                <p className="text-gray-500">Be the first to share your trip!</p>
              </div>
            ) : (
              posts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => handlePostSelect(post)}
                  className={`bg-white rounded-lg border p-4 cursor-pointer transition-all ${
                    selectedPost?.id === post.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <input
                      type="radio"
                      checked={selectedPost?.id === post.id}
                      readOnly
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <img
                          src={post.profiles?.avatar_url || '/default-avatar.png'}
                          alt="Avatar"
                          className="w-8 h-8 rounded-full"
                        />
                        <span className="font-medium text-sm">
                          {post.profiles?.first_name} {post.profiles?.last_name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(post.created_at)}
                        </span>
                      </div>

                      <h3 className="font-semibold text-gray-900 mb-1">{post.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {truncateText(post.content)}
                      </p>

                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {post.tags.map(tag => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleLike(post.id)
                          }}
                          className="flex items-center gap-1 hover:text-red-500"
                        >
                          <Heart className="w-4 h-4" />
                          {post.like_count}
                        </button>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          {post.comment_count}
                        </div>
                        <div className="flex items-center gap-1">
                          <Copy className="w-4 h-4" />
                          {post.copy_count}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Infinite scroll trigger */}
            <div ref={observerRef} className="h-4" />
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-2">
            {selectedPost ? (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                {/* Post Header */}
                <div className="flex items-start gap-4 mb-6">
                  <img
                    src={selectedPost.profiles?.avatar_url || '/default-avatar.png'}
                    alt="Avatar"
                    className="w-12 h-12 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">
                        {selectedPost.profiles?.first_name} {selectedPost.profiles?.last_name}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(selectedPost.created_at)}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedPost.title}</h2>

                    {selectedPost.tags && selectedPost.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {selectedPost.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Full Content */}
                <div className="prose max-w-none mb-6">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedPost.content}</p>
                </div>

                {/* Trip Summary */}
                {selectedPost.trips && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Trip Summary</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Destination:</span>
                        <span className="ml-2 font-medium">{selectedPost.trips.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Duration:</span>
                        <span className="ml-2 font-medium">
                          {selectedPost.trips.start_date && selectedPost.trips.end_date
                            ? `${Math.ceil((new Date(selectedPost.trips.end_date) - new Date(selectedPost.trips.start_date)) / (1000 * 60 * 60 * 24))} days`
                            : 'N/A'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-4 mb-6">
                  <button
                    onClick={() => handleLike(selectedPost.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      selectedPost.like_count > 0 ? 'text-red-600 hover:bg-red-50' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Heart className="w-4 h-4" />
                    Like ({selectedPost.like_count})
                  </button>

                  <button
                    onClick={handleCopyTrip}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Copy This Trip
                  </button>

                  <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </div>

                {/* Comments Section */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Comments ({selectedPost.comment_count})</h3>

                  {user ? (
                    <form onSubmit={handleCommentSubmit} className="mb-6">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                      />
                      <button
                        type="submit"
                        disabled={submittingComment || !newComment.trim()}
                        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submittingComment ? 'Posting...' : 'Post Comment'}
                      </button>
                    </form>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                      <p className="text-yellow-800">Login to interact with this post</p>
                    </div>
                  )}

                  {/* Comments List */}
                  {loadingComments ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                  ) : comments.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>
                  ) : (
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <img
                            src={comment.profiles?.avatar_url || '/default-avatar.png'}
                            alt="Avatar"
                            className="w-8 h-8 rounded-full flex-shrink-0"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">
                                {comment.profiles?.first_name} {comment.profiles?.last_name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDate(comment.created_at)}
                              </span>
                            </div>
                            <p className="text-gray-700 text-sm">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a post to view details</h3>
                <p className="text-gray-500">Click on any community post to see the full content and comments.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}