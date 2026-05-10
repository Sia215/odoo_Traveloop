const express = require('express');
const router = express.Router();
const supabaseAdmin = require('../supabaseAdmin');
const verifyToken = require('../middleware/verifyToken');
const crypto = require('crypto');

const DEFAULT_CHECKLIST = [
  { category: 'Documents',   label: 'Passport',                    sort_order: 0 },
  { category: 'Documents',   label: 'Flight Tickets',              sort_order: 1 },
  { category: 'Documents',   label: 'Travel Insurance',            sort_order: 2 },
  { category: 'Documents',   label: 'Hotel Booking Confirmation',  sort_order: 3 },
  { category: 'Clothing',    label: 'Casual Shirts',               sort_order: 0 },
  { category: 'Clothing',    label: 'Trousers/Jeans',              sort_order: 1 },
  { category: 'Clothing',    label: 'Comfortable Walking Shoes',   sort_order: 2 },
  { category: 'Clothing',    label: 'Light Jacket/Windbreaker',    sort_order: 3 },
  { category: 'Electronics', label: 'Universal Power Adapter',     sort_order: 0 },
  { category: 'Electronics', label: 'Earphones/Headphones',        sort_order: 1 },
];

// ─── Trips ────────────────────────────────────────────────────────────────────

// GET /api/trips
router.get('/', verifyToken, async (req, res) => {
  const { limit, status } = req.query;
  let query = supabaseAdmin
    .from('trips')
    .select('id, name, description, start_date, end_date, status, cover_photo, destination_count')
    .eq('user_id', req.user.id)
    .order('start_date', { ascending: true });
  if (status) query = query.eq('status', status);
  if (limit && limit !== 'all') query = query.limit(parseInt(limit));
  const { data, error } = await query;
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, trips: data });
});

// POST /api/trips
router.post('/', verifyToken, async (req, res) => {
  const { name, place_id, start_date, end_date, description, cover_photo, status } = req.body;
  if (!name || !start_date || !end_date)
    return res.status(400).json({ success: false, message: 'name, start_date and end_date are required' });
  const { data, error } = await supabaseAdmin.from('trips').insert({
    user_id: req.user.id, name,
    description: description || null, start_date, end_date,
    status: status || 'upcoming',
    cover_photo: cover_photo || null,
    destination_count: place_id ? 1 : 0,
  }).select().single();
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.status(201).json({ success: true, trip: data });
});

// GET /api/trips/:id
router.get('/:id', verifyToken, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('trips')
    .select('id, name, start_date, end_date, status, cover_photo, description, destination_count')
    .eq('id', req.params.id).eq('user_id', req.user.id).single();
  if (error || !data) return res.status(404).json({ success: false, message: 'Trip not found' });
  return res.json({ success: true, trip: data });
});

// POST /api/trips/:id/sections
router.post('/:id/sections', verifyToken, async (req, res) => {
  const { sections } = req.body;
  const tripId = req.params.id;
  const { data: trip, error: tripErr } = await supabaseAdmin
    .from('trips').select('id').eq('id', tripId).eq('user_id', req.user.id).single();
  if (tripErr || !trip) return res.status(404).json({ success: false, message: 'Trip not found' });
  await supabaseAdmin.from('trip_sections').delete().eq('trip_id', tripId);
  const rows = (sections || []).map((s, i) => ({
    trip_id: tripId,
    description: s.description || null,
    start_date: s.start_date || null,
    end_date: s.end_date || null,
    budget: parseFloat(s.budget) || 0,
    order_index: i,
  }));
  const { data, error } = await supabaseAdmin.from('trip_sections').insert(rows).select();
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, sections: data });
});

// GET /api/trips/:id/sections
router.get('/:id/sections', verifyToken, async (req, res) => {
  const tripId = req.params.id;
  const { data: trip, error: tripErr } = await supabaseAdmin
    .from('trips').select('id').eq('id', tripId).eq('user_id', req.user.id).single();
  if (tripErr || !trip) return res.status(404).json({ success: false, message: 'Trip not found' });
  const { data, error } = await supabaseAdmin
    .from('trip_sections').select('*').eq('trip_id', tripId).order('order_index');
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, sections: data });
});

// PATCH /api/trips/:id/sections/reorder
router.patch('/:id/sections/reorder', verifyToken, async (req, res) => {
  const { sections } = req.body;
  const { data: trip, error: chkErr } = await supabaseAdmin
    .from('trips').select('id').eq('id', req.params.id).eq('user_id', req.user.id).single();
  if (chkErr || !trip) return res.status(404).json({ success: false, message: 'Trip not found' });
  const updates = await Promise.all(
    (sections || []).map(({ id, order_index }) =>
      supabaseAdmin.from('trip_sections').update({ order_index }).eq('id', id)
    )
  );
  const failed = updates.find(r => r.error);
  if (failed) return res.status(500).json({ success: false, message: failed.error.message });
  return res.json({ success: true });
});

// PATCH /api/trips/:id
router.patch('/:id', verifyToken, async (req, res) => {
  const allowed = ['name','description','status','cover_photo','destination_count','start_date','end_date'];
  const updates = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  if (!Object.keys(updates).length)
    return res.status(400).json({ success: false, message: 'No valid fields' });
  const { data: trip, error: chkErr } = await supabaseAdmin
    .from('trips').select('id').eq('id', req.params.id).eq('user_id', req.user.id).single();
  if (chkErr || !trip) return res.status(404).json({ success: false, message: 'Trip not found' });
  const { data, error } = await supabaseAdmin
    .from('trips').update(updates).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, trip: data });
});

// DELETE /api/trips/:id
router.delete('/:id', verifyToken, async (req, res) => {
  const { data: trip, error: fetchError } = await supabaseAdmin
    .from('trips').select('id').eq('id', req.params.id).eq('user_id', req.user.id).single();
  if (fetchError || !trip)
    return res.status(404).json({ success: false, message: 'Trip not found or unauthorized' });
  const { error } = await supabaseAdmin.from('trips').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, message: 'Trip deleted' });
});

// ─── Checklist ────────────────────────────────────────────────────────────────

// GET /api/trips/:id/checklist
router.get('/:id/checklist', async (req, res) => {
  const tripId = req.params.id;
  const { token } = req.query;

  if (token) {
    const { data: link } = await supabaseAdmin
      .from('checklist_share_links').select('trip_id')
      .eq('share_token', token).eq('trip_id', tripId).single();
    if (!link) return res.status(403).json({ success: false, message: 'Invalid share token' });
    const { data, error } = await supabaseAdmin
      .from('checklist_items').select('*').eq('trip_id', tripId)
      .order('category').order('sort_order');
    if (error) return res.status(500).json({ success: false, message: error.message });
    return res.json({ success: true, items: data, readonly: true });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer '))
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(authHeader.split(' ')[1]);
  if (authErr || !user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { data: trip } = await supabaseAdmin
    .from('trips').select('id').eq('id', tripId).eq('user_id', user.id).single();
  if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

  const { count } = await supabaseAdmin
    .from('checklist_items').select('id', { count: 'exact', head: true })
    .eq('trip_id', tripId).eq('user_id', user.id);
  if (count === 0) {
    await supabaseAdmin.from('checklist_items').insert(
      DEFAULT_CHECKLIST.map(item => ({ ...item, trip_id: tripId, user_id: user.id, is_default: true }))
    );
  }

  const { data, error } = await supabaseAdmin
    .from('checklist_items').select('*')
    .eq('trip_id', tripId).eq('user_id', user.id)
    .order('category').order('sort_order');
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, items: data });
});

// POST /api/trips/:id/checklist
router.post('/:id/checklist', verifyToken, async (req, res) => {
  const { label, category } = req.body;
  if (!label?.trim() || !category)
    return res.status(400).json({ success: false, message: 'label and category required' });
  const tripId = req.params.id;
  const { data: trip } = await supabaseAdmin
    .from('trips').select('id').eq('id', tripId).eq('user_id', req.user.id).single();
  if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
  const { count } = await supabaseAdmin
    .from('checklist_items').select('id', { count: 'exact', head: true })
    .eq('trip_id', tripId).eq('category', category);
  const { data, error } = await supabaseAdmin.from('checklist_items').insert({
    trip_id: tripId, user_id: req.user.id,
    label: label.trim(), category, sort_order: count || 0,
  }).select().single();
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.status(201).json({ success: true, item: data });
});

// POST /api/trips/:id/checklist/share
router.post('/:id/checklist/share', verifyToken, async (req, res) => {
  const tripId = req.params.id;
  const { data: trip } = await supabaseAdmin
    .from('trips').select('id').eq('id', tripId).eq('user_id', req.user.id).single();
  if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
  const { data: existing } = await supabaseAdmin
    .from('checklist_share_links').select('share_token')
    .eq('trip_id', tripId).eq('user_id', req.user.id).single();
  if (existing) return res.json({ success: true, token: existing.share_token });
  const token = crypto.randomBytes(20).toString('hex');
  const { error } = await supabaseAdmin.from('checklist_share_links').insert({
    trip_id: tripId, user_id: req.user.id, share_token: token,
  });
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, token });
});

// DELETE /api/trips/:id/checklist/reset
router.delete('/:id/checklist/reset', verifyToken, async (req, res) => {
  const { error } = await supabaseAdmin
    .from('checklist_items')
    .update({ is_packed: false, updated_at: new Date().toISOString() })
    .eq('trip_id', req.params.id).eq('user_id', req.user.id);
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true });
});

// PATCH /api/trips/:id/checklist/:itemId
router.patch('/:id/checklist/:itemId', verifyToken, async (req, res) => {
  const allowed = ['is_packed', 'label'];
  const updates = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  if (!Object.keys(updates).length)
    return res.status(400).json({ success: false, message: 'No valid fields' });
  updates.updated_at = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from('checklist_items').update(updates)
    .eq('id', req.params.itemId).eq('user_id', req.user.id)
    .select().single();
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, item: data });
});

// DELETE /api/trips/:id/checklist/:itemId
router.delete('/:id/checklist/:itemId', verifyToken, async (req, res) => {
  const { error } = await supabaseAdmin
    .from('checklist_items').delete()
    .eq('id', req.params.itemId).eq('user_id', req.user.id);
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true });
});

// ─── Trip Activities ───────────────────────────────────────────────────────────────

// GET /api/trips/:tripId/activities
router.get('/:tripId/activities', verifyToken, async (req, res) => {
  const { tripId } = req.params;
  const { data: trip } = await supabaseAdmin
    .from('trips').select('id').eq('id', tripId).eq('user_id', req.user.id).single();
  if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
  const { data, error } = await supabaseAdmin
    .from('trip_activities')
    .select('*, activities(*)')
    .eq('trip_id', tripId);
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, activities: data });
});

// POST /api/trips/:tripId/activities
router.post('/:tripId/activities', verifyToken, async (req, res) => {
  const { tripId } = req.params;
  const { activity_id, section_id } = req.body;
  if (!activity_id) return res.status(400).json({ success: false, message: 'activity_id required' });
  const { data: trip } = await supabaseAdmin
    .from('trips').select('id').eq('id', tripId).eq('user_id', req.user.id).single();
  if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
  const { data: existing } = await supabaseAdmin
    .from('trip_activities').select('id')
    .eq('trip_id', tripId).eq('activity_id', activity_id).single();
  if (existing) return res.json({ success: true, trip_activity: existing });
  const { data, error } = await supabaseAdmin
    .from('trip_activities')
    .insert({ trip_id: tripId, activity_id, section_id: section_id || null })
    .select().single();
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.status(201).json({ success: true, trip_activity: data });
});

// DELETE /api/trips/:tripId/activities/:activityId
router.delete('/:tripId/activities/:activityId', verifyToken, async (req, res) => {
  const { tripId, activityId } = req.params;
  const { data: trip } = await supabaseAdmin
    .from('trips').select('id').eq('id', tripId).eq('user_id', req.user.id).single();
  if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
  const { error } = await supabaseAdmin
    .from('trip_activities')
    .delete()
    .eq('trip_id', tripId)
    .eq('activity_id', activityId);
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true });
});

module.exports = router;
