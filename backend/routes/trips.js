const express = require('express');
const router = express.Router();
const supabaseAdmin = require('../supabaseAdmin');
const verifyToken = require('../middleware/verifyToken');

// GET /api/trips
router.get('/', verifyToken, async (req, res) => {
  const { limit, status } = req.query;
  const userId = req.user.id;

  let query = supabaseAdmin
    .from('trips')
    .select('id, name, description, start_date, end_date, status, cover_photo, destination_count')
    .eq('user_id', userId)
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
  if (!name || !start_date || !end_date) {
    return res.status(400).json({ success: false, message: 'name, start_date and end_date are required' });
  }
  const { data, error } = await supabaseAdmin.from('trips').insert({
    user_id: req.user.id,
    name,
    description: description || null,
    start_date,
    end_date,
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
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .single();
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

// DELETE /api/trips/:id
router.delete('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const { data: trip, error: fetchError } = await supabaseAdmin
    .from('trips')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (fetchError || !trip) {
    return res.status(404).json({ success: false, message: 'Trip not found or unauthorized' });
  }

  const { error } = await supabaseAdmin.from('trips').delete().eq('id', id);
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, message: 'Trip deleted' });
});

module.exports = router;
