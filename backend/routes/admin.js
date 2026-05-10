const express = require('express');
const router = express.Router();
const supabaseAdmin = require('../supabaseAdmin');
const verifyToken = require('../middleware/verifyToken');
const adminOnly = require('../middleware/adminOnly');

router.use(verifyToken);
router.use(adminOnly);

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [
      { count: totalUsers },
      { count: totalTrips },
      { count: totalPosts },
      { count: totalCities },
      { count: totalActivities },
      { count: ongoingTrips },
      { count: upcomingTrips },
      { count: completedTrips }
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'user'),
      supabaseAdmin.from('trips').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('community_posts').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('cities').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('activities').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('trips').select('*', { count: 'exact', head: true }).eq('status', 'ongoing'),
      supabaseAdmin.from('trips').select('*', { count: 'exact', head: true }).eq('status', 'upcoming'),
      supabaseAdmin.from('trips').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    ]);
    res.json({ totalUsers, totalTrips, totalPosts, totalCities, totalActivities, ongoingTrips, upcomingTrips, completedTrips });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name, email, role, city, country, created_at', { count: 'exact' })
      .eq('role', 'user')
      .order('created_at', { ascending: false });

    if (search) query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;
    res.json({ users: data, total: count, page, limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (req.user.id === req.params.id) return res.status(400).json({ error: 'Cannot change your own role' });
    if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
    const { data, error } = await supabaseAdmin.from('profiles').update({ role }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, role: data.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    if (req.user.id === req.params.id) return res.status(400).json({ error: 'Cannot delete your own account' });
    const { data: target } = await supabaseAdmin.from('profiles').select('role').eq('id', req.params.id).single();
    if (!target) return res.status(404).json({ error: 'User not found' });
    if (target.role === 'admin') return res.status(403).json({ error: 'Cannot delete admin accounts' });
    await supabaseAdmin.from('profiles').delete().eq('id', req.params.id);
    await supabaseAdmin.auth.admin.deleteUser(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/trips
router.get('/trips', async (req, res) => {
  try {
    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 10;
    const status = req.query.status || '';
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('trips')
      .select('id, name, start_date, end_date, status, user_id, created_at, destination_count, profiles!inner(first_name, last_name, email)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (search) query = query.ilike('name', `%${search}%`);
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    const trips = (data || []).map(t => ({
      ...t,
      user_name:  t.profiles ? `${t.profiles.first_name || ''} ${t.profiles.last_name || ''}`.trim() : 'Unknown',
      user_email: t.profiles?.email || 'Unknown',
    }));
    res.json({ trips, total: count, page, limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/trips/:id
router.delete('/trips/:id', async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from('trips').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/cities
router.get('/cities', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('cities').select('*').order('popularity', { ascending: false });
    if (error) throw error;
    res.json({ cities: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/cities/popular
router.get('/cities/popular', async (req, res) => {
  try {
    const { data: trips } = await supabaseAdmin.from('trips').select('name');
    // Use trip names as proxy for city popularity since place_id join may not exist
    const { data: cities } = await supabaseAdmin.from('cities').select('name, country, popularity').order('popularity', { ascending: false }).limit(8);
    const result = (cities || []).map(c => ({ name: c.name, country: c.country, count: c.popularity || 0 }));
    res.json({ cities: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/cities
router.post('/cities', async (req, res) => {
  try {
    const { name, country, cost_index, popularity } = req.body;
    if (!name || !country) return res.status(400).json({ error: 'Name and country are required' });
    const { data, error } = await supabaseAdmin.from('cities').insert([{ name, country, cost_index: parseInt(cost_index) || 0, popularity: parseInt(popularity) || 0 }]).select().single();
    if (error) throw error;
    res.json({ success: true, city: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/cities/:id
router.delete('/cities/:id', async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from('cities').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/posts
router.get('/posts', async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const from  = (page - 1) * limit;

    const { data, error, count } = await supabaseAdmin
      .from('community_posts')
      .select('id, title, category, like_count, created_at, user_id, profiles!inner(first_name, last_name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (error) throw error;
    const posts = (data || []).map(p => ({
      ...p,
      author: p.profiles ? `${p.profiles.first_name || ''} ${p.profiles.last_name || ''}`.trim() : 'Unknown',
    }));
    res.json({ posts, total: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/posts/:id
router.delete('/posts/:id', async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from('community_posts').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/analytics
router.get('/analytics', async (req, res) => {
  try {
    const [{ data: userRows }, { data: tripRows }, { data: postRows }, { data: actRows }] = await Promise.all([
      supabaseAdmin.from('profiles').select('created_at').eq('role', 'user').gte('created_at', new Date(Date.now() - 180 * 86400000).toISOString()).order('created_at', { ascending: true }),
      supabaseAdmin.from('trips').select('status'),
      supabaseAdmin.from('community_posts').select('category'),
      supabaseAdmin.from('activities').select('category'),
    ]);

    // User growth by month
    const monthlyUsers = {};
    (userRows || []).forEach(u => {
      const m = new Date(u.created_at).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      monthlyUsers[m] = (monthlyUsers[m] || 0) + 1;
    });

    // Trip status
    const statusCounts = { ongoing: 0, upcoming: 0, completed: 0 };
    (tripRows || []).forEach(t => { if (statusCounts[t.status] !== undefined) statusCounts[t.status]++; });

    // Post categories
    const postCategories = {};
    (postRows || []).forEach(p => { postCategories[p.category || 'General'] = (postCategories[p.category || 'General'] || 0) + 1; });

    // Activity categories
    const actCategories = {};
    (actRows || []).forEach(a => { actCategories[a.category || 'Other'] = (actCategories[a.category || 'Other'] || 0) + 1; });

    res.json({
      userGrowth:     Object.entries(monthlyUsers).map(([month, count]) => ({ month, count })),
      tripStatus:     Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
      postCategories: Object.entries(postCategories).map(([category, count]) => ({ category, count })),
      actCategories:  Object.entries(actCategories).map(([category, count]) => ({ category, count })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
