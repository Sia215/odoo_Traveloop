const router = require('express').Router()
const verifyToken = require('../middleware/verifyToken')
const { verifyAdmin } = require('../middleware/verifyToken')
const supabaseAdmin = require('../supabaseAdmin')

router.use(verifyToken, verifyAdmin)

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [u, t, p, c, a, on, up, done] = await Promise.all([
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'user'),
      supabaseAdmin.from('trips').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('community_posts').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('cities').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('activities').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('trips').select('start_date, end_date'),
    ])
    const today = new Date().toISOString().split('T')[0]
    const allTrips = on.data || []
    let ongoingCount = 0, upcomingCount = 0, completedCount = 0
    allTrips.forEach(trip => {
      if (!trip.start_date || !trip.end_date) { upcomingCount++; return }
      if (trip.end_date < today) completedCount++
      else if (trip.start_date <= today && trip.end_date >= today) ongoingCount++
      else upcomingCount++
    })
    res.json({
      totalUsers: u.count,
      totalTrips: t.count,
      totalPosts: p.count,
      totalCities: c.count,
      totalActivities: a.count,
      ongoingTrips: ongoingCount,
      upcomingTrips: upcomingCount,
      completedTrips: completedCount,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/admin/users?search=&page=1&limit=10
router.get('/users', async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1
    const limit = parseInt(req.query.limit) || 10
    const search = req.query.search || ''
    const from = (page - 1) * limit

    let q = supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name, email, role, city, country, created_at', { count: 'exact' })
      .eq('role', 'user')
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1)

    if (search) q = q.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)

    const { data, count, error } = await q
    if (error) throw error
    res.json({ users: data, total: count, page, limit })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body
    if (req.user.id === req.params.id)
      return res.status(400).json({ error: 'Cannot change your own role' })
    if (!['user', 'admin'].includes(role))
      return res.status(400).json({ error: 'Invalid role' })
    const { data, error } = await supabaseAdmin
      .from('profiles').update({ role }).eq('id', req.params.id).select().single()
    if (error) throw error
    res.json({ success: true, role: data.role })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    if (req.user.id === req.params.id)
      return res.status(400).json({ error: 'Cannot delete your own account' })
    const { data: target } = await supabaseAdmin
      .from('profiles').select('role').eq('id', req.params.id).single()
    if (!target) return res.status(404).json({ error: 'User not found' })
    if (target.role === 'admin')
      return res.status(403).json({ error: 'Cannot delete admin accounts' })
    await supabaseAdmin.from('profiles').delete().eq('id', req.params.id)
    await supabaseAdmin.auth.admin.deleteUser(req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/admin/analytics
router.get('/analytics', async (req, res) => {
  try {
    const [{ data: userRows }, { data: tripRows }, { data: postRows }, { data: actRows }] =
      await Promise.all([
        supabaseAdmin.from('profiles').select('created_at').eq('role', 'user')
          .gte('created_at', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: true }),
        supabaseAdmin.from('trips').select('start_date, end_date'),
        supabaseAdmin.from('community_posts').select('category'),
        supabaseAdmin.from('activities').select('category'),
      ])

    const monthlyUsers = {}
    ;(userRows || []).forEach(u => {
      const m = new Date(u.created_at).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
      monthlyUsers[m] = (monthlyUsers[m] || 0) + 1
    })

    const today = new Date().toISOString().split('T')[0]
    const statusCounts = { ongoing: 0, upcoming: 0, completed: 0 }
    ;(tripRows || []).forEach(t => {
      if (!t.start_date || !t.end_date) { statusCounts.upcoming++; return }
      if (t.end_date < today) statusCounts.completed++
      else if (t.start_date <= today && t.end_date >= today) statusCounts.ongoing++
      else statusCounts.upcoming++
    })

    const postCategories = {}
    ;(postRows || []).forEach(p => {
      const cat = p.category || 'General'
      postCategories[cat] = (postCategories[cat] || 0) + 1
    })

    const actCategories = {}
    ;(actRows || []).forEach(a => {
      const cat = a.category || 'Other'
      actCategories[cat] = (actCategories[cat] || 0) + 1
    })

    res.json({
      userGrowth:         Object.entries(monthlyUsers).map(([month, count]) => ({ month, count })),
      tripStatus:         Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
      postCategories:     Object.entries(postCategories).map(([category, count]) => ({ category, count })),
      activityCategories: Object.entries(actCategories).map(([category, count]) => ({ category, count })),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/admin/cities/popular  — must be before /cities/:id
router.get('/cities/popular', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('cities')
      .select('name, country, popularity')
      .order('popularity', { ascending: false })
      .limit(8)
    if (error) throw error
    const cities = (data || []).map(c => ({ name: c.name, country: c.country, count: c.popularity || 0 }))
    res.json({ cities })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/admin/cities
router.get('/cities', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('cities').select('*').order('popularity', { ascending: false })
    if (error) throw error
    res.json({ cities: data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/admin/cities
router.post('/cities', async (req, res) => {
  try {
    const { name, country, cost_index, popularity } = req.body
    if (!name || !country) return res.status(400).json({ error: 'Name and country are required' })
    const { data, error } = await supabaseAdmin
      .from('cities')
      .insert([{ name, country, cost_index: parseInt(cost_index) || 0, popularity: parseInt(popularity) || 0 }])
      .select().single()
    if (error) throw error
    res.json({ success: true, city: data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/admin/cities/:id
router.delete('/cities/:id', async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from('cities').delete().eq('id', req.params.id)
    if (error) throw error
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/admin/posts?page=1&limit=10
router.get('/posts', async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1
    const limit = parseInt(req.query.limit) || 10
    const from  = (page - 1) * limit

    const { data, count, error } = await supabaseAdmin
      .from('community_posts')
      .select('id, title, category, like_count, created_at, user_id, profiles!inner(first_name, last_name)',
        { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1)

    if (error) throw error
    const posts = (data || []).map(p => ({
      ...p,
      author: p.profiles
        ? `${p.profiles.first_name || ''} ${p.profiles.last_name || ''}`.trim()
        : 'Unknown',
    }))
    res.json({ posts, total: count })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/admin/posts/:id
router.delete('/posts/:id', async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('community_posts').delete().eq('id', req.params.id)
    if (error) throw error
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/admin/trips?search=&status=&page=1&limit=10
router.get('/trips', async (req, res) => {
  try {
    const page   = parseInt(req.query.page)  || 1
    const limit  = parseInt(req.query.limit) || 10
    const status = req.query.status || ''
    const search = req.query.search || ''
    const offset = (page - 1) * limit

    let q = supabaseAdmin
      .from('trips')
      .select(
        'id, name, start_date, end_date, status, user_id, created_at, profiles!inner(first_name, last_name, email)',
        { count: 'exact' })
      .order('created_at', { ascending: false })

    if (status) q = q.eq('status', status)
    if (search) q = q.ilike('name', `%${search}%`)
    q = q.range(offset, offset + limit - 1)

    const { data, count, error } = await q
    if (error) throw error

    const trips = (data || []).map(t => ({
      ...t,
      user_name:  t.profiles ? `${t.profiles.first_name || ''} ${t.profiles.last_name || ''}`.trim() : 'Unknown',
      user_email: t.profiles?.email || 'Unknown',
    }))
    res.json({ trips, total: count, page, limit })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/admin/trips/:id
router.delete('/trips/:id', async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from('trips').delete().eq('id', req.params.id)
    if (error) throw error
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
