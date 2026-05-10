const express = require('express');
const router = express.Router({ mergeParams: true });
const supabaseAdmin = require('../supabaseAdmin');
const verifyToken = require('../middleware/verifyToken');
const crypto = require('crypto');

const DEFAULT_ITEMS = [
  { category: 'Documents', label: 'Passport', sort_order: 0 },
  { category: 'Documents', label: 'Flight Tickets', sort_order: 1 },
  { category: 'Documents', label: 'Travel Insurance', sort_order: 2 },
  { category: 'Documents', label: 'Hotel Booking Confirmation', sort_order: 3 },
  { category: 'Clothing', label: 'Casual Shirts', sort_order: 0 },
  { category: 'Clothing', label: 'Trousers/Jeans', sort_order: 1 },
  { category: 'Clothing', label: 'Comfortable Walking Shoes', sort_order: 2 },
  { category: 'Clothing', label: 'Light Jacket/Windbreaker', sort_order: 3 },
  { category: 'Electronics', label: 'Universal Power Adapter', sort_order: 0 },
  { category: 'Electronics', label: 'Earphones/Headphones', sort_order: 1 },
];

// GET /api/trips/:id/checklist  (auth OR public token)
router.get('/', async (req, res) => {
  const { token } = req.query;
  const tripId = req.params.id;

  // public shared view
  if (token) {
    const { data: link } = await supabaseAdmin
      .from('checklist_share_links')
      .select('trip_id')
      .eq('share_token', token)
      .eq('trip_id', tripId)
      .single();
    if (!link) return res.status(403).json({ success: false, message: 'Invalid share token' });
    const { data, error } = await supabaseAdmin
      .from('checklist_items')
      .select('*')
      .eq('trip_id', tripId)
      .order('category').order('sort_order');
    if (error) return res.status(500).json({ success: false, message: error.message });
    return res.json({ success: true, items: data, readonly: true });
  }

  // authenticated
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Unauthorized' });
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(authHeader.split(' ')[1]);
  if (authErr || !user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  // verify trip ownership
  const { data: trip } = await supabaseAdmin.from('trips').select('id').eq('id', tripId).eq('user_id', user.id).single();
  if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

  // seed defaults if empty
  const { count } = await supabaseAdmin
    .from('checklist_items').select('id', { count: 'exact', head: true })
    .eq('trip_id', tripId).eq('user_id', user.id);
  if (count === 0) {
    await supabaseAdmin.from('checklist_items').insert(
      DEFAULT_ITEMS.map(item => ({ ...item, trip_id: tripId, user_id: user.id, is_default: true }))
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
router.post('/', verifyToken, async (req, res) => {
  const { label, category } = req.body;
  if (!label?.trim() || !category) return res.status(400).json({ success: false, message: 'label and category required' });
  const tripId = req.params.id;
  const { data: trip } = await supabaseAdmin.from('trips').select('id').eq('id', tripId).eq('user_id', req.user.id).single();
  if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
  const { count } = await supabaseAdmin
    .from('checklist_items').select('id', { count: 'exact', head: true })
    .eq('trip_id', tripId).eq('category', category);
  const { data, error } = await supabaseAdmin.from('checklist_items').insert({
    trip_id: tripId, user_id: req.user.id,
    label: label.trim(), category,
    sort_order: count || 0,
  }).select().single();
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.status(201).json({ success: true, item: data });
});

// PATCH /api/trips/:id/checklist/:itemId
router.patch('/:itemId', verifyToken, async (req, res) => {
  const allowed = ['is_packed', 'label'];
  const updates = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  if (!Object.keys(updates).length) return res.status(400).json({ success: false, message: 'No valid fields' });
  updates.updated_at = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from('checklist_items').update(updates)
    .eq('id', req.params.itemId).eq('user_id', req.user.id)
    .select().single();
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, item: data });
});

// DELETE /api/trips/:id/checklist/reset  (must be before /:itemId)
router.delete('/reset', verifyToken, async (req, res) => {
  const { error } = await supabaseAdmin
    .from('checklist_items').update({ is_packed: false, updated_at: new Date().toISOString() })
    .eq('trip_id', req.params.id).eq('user_id', req.user.id);
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true });
});

// DELETE /api/trips/:id/checklist/:itemId
router.delete('/:itemId', verifyToken, async (req, res) => {
  const { error } = await supabaseAdmin
    .from('checklist_items').delete()
    .eq('id', req.params.itemId).eq('user_id', req.user.id);
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true });
});

// POST /api/trips/:id/checklist/share
router.post('/share', verifyToken, async (req, res) => {
  const tripId = req.params.id;
  const { data: trip } = await supabaseAdmin.from('trips').select('id').eq('id', tripId).eq('user_id', req.user.id).single();
  if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
  // reuse existing token if present
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

module.exports = router;
