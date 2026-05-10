const express = require('express');
const router = express.Router();
const supabaseAdmin = require('../supabaseAdmin');
const verifyToken = require('../middleware/verifyToken');

// GET /api/activities/categories
router.get('/categories', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('activities').select('category').order('category');
  if (error) return res.status(500).json({ success: false, message: error.message });
  const categories = [...new Set(data.map(r => r.category).filter(Boolean))].sort();
  return res.json({ categories });
});

// GET /api/activities/cities
router.get('/cities', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('activities').select('city_name').not('city_name', 'is', null).order('city_name');
  if (error) return res.status(500).json({ success: false, message: error.message });
  const cities = [...new Set(data.map(r => r.city_name).filter(Boolean))].sort();
  return res.json({ cities });
});

// GET /api/activities
router.get('/', async (req, res) => {
  const { search, category, city, min_cost, max_cost, max_duration, sort } = req.query;
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 12);
  const from  = (page - 1) * limit;
  const to    = from + limit - 1;

  let query = supabaseAdmin.from('activities').select('*', { count: 'exact' });
  if (search)       query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  if (category)     query = query.eq('category', category);
  if (city)         query = query.eq('city_name', city);
  if (min_cost)     query = query.gte('estimated_cost', min_cost);
  if (max_cost)     query = query.lte('estimated_cost', max_cost);
  if (max_duration) query = query.lte('duration_hours', max_duration);

  if (sort === 'cost_asc')       query = query.order('estimated_cost', { ascending: true });
  else if (sort === 'cost_desc') query = query.order('estimated_cost', { ascending: false });
  else if (sort === 'rating')    query = query.order('rating',         { ascending: false });
  else if (sort === 'duration')  query = query.order('duration_hours', { ascending: true });
  else                           query = query.order('created_at',     { ascending: false });

  query = query.range(from, to);
  const { data, error, count } = await query;
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ activities: data, total: count, page, limit });
});

module.exports = router;
