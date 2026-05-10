const express = require('express');
const router = express.Router();
const supabaseAdmin = require('../supabaseAdmin');

// GET /api/cities/popular
router.get('/popular', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('cities')
    .select('id, name, country, cost_index, popularity, image_url')
    .order('popularity', { ascending: false })
    .limit(5);

  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, cities: data });
});

// GET /api/cities/search?q=
router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json({ success: true, cities: [] });

  const { data, error } = await supabaseAdmin
    .from('cities')
    .select('id, name, country')
    .ilike('name', `%${q}%`)
    .limit(10);

  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, cities: data });
});

// GET /api/cities/suggestions (activities)
router.get('/suggestions', async (req, res) => {
  const limit = parseInt(req.query.limit) || 6;
  const { data, error } = await supabaseAdmin
    .from('activities')
    .select('id, name, category, estimated_cost, image_url')
    .limit(limit);
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, activities: data });
});

module.exports = router;
