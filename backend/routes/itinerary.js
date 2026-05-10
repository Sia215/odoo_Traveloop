const express = require('express');
const router = express.Router();
const supabaseAdmin = require('../supabaseAdmin');
const verifyToken = require('../middleware/verifyToken');

// Helper: verify trip belongs to user
async function ownedTrip(tripId, userId) {
  const { data, error } = await supabaseAdmin
    .from('trips').select('id').eq('id', tripId).eq('user_id', userId).single();
  return !error && !!data;
}

// ── Trip Stops ────────────────────────────────────────────────────────────────

// GET /api/itinerary/:tripId/stops
router.get('/:tripId/stops', verifyToken, async (req, res) => {
  if (!await ownedTrip(req.params.tripId, req.user.id))
    return res.status(404).json({ success: false, message: 'Trip not found' });
  const { data, error } = await supabaseAdmin
    .from('trip_stops')
    .select('*')
    .eq('trip_id', req.params.tripId)
    .order('day_number', { ascending: true });
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, stops: data });
});

// POST /api/itinerary/:tripId/stops
router.post('/:tripId/stops', verifyToken, async (req, res) => {
  if (!await ownedTrip(req.params.tripId, req.user.id))
    return res.status(404).json({ success: false, message: 'Trip not found' });
  const { city_name, country, start_date, end_date, day_number, stay_budget, notes } = req.body;
  if (!city_name) return res.status(400).json({ success: false, message: 'city_name required' });
  const { data, error } = await supabaseAdmin.from('trip_stops').insert({
    trip_id: req.params.tripId, city_name, country: country || null,
    start_date: start_date || null, end_date: end_date || null,
    day_number: day_number || 1, stay_budget: stay_budget || 0, notes: notes || null,
  }).select().single();
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.status(201).json({ success: true, stop: data });
});

// DELETE /api/itinerary/:tripId/stops/:stopId
router.delete('/:tripId/stops/:stopId', verifyToken, async (req, res) => {
  if (!await ownedTrip(req.params.tripId, req.user.id))
    return res.status(404).json({ success: false, message: 'Trip not found' });
  const { error } = await supabaseAdmin.from('trip_stops').delete().eq('id', req.params.stopId);
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true });
});

// ── Activities ────────────────────────────────────────────────────────────────

// GET /api/itinerary/:tripId/activities
router.get('/:tripId/activities', verifyToken, async (req, res) => {
  if (!await ownedTrip(req.params.tripId, req.user.id))
    return res.status(404).json({ success: false, message: 'Trip not found' });
  const { data, error } = await supabaseAdmin
    .from('trip_activities')
    .select('*')
    .eq('trip_id', req.params.tripId)
    .order('activity_time', { ascending: true, nullsFirst: false });
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, activities: data });
});

// POST /api/itinerary/:tripId/activities
router.post('/:tripId/activities', verifyToken, async (req, res) => {
  if (!await ownedTrip(req.params.tripId, req.user.id))
    return res.status(404).json({ success: false, message: 'Trip not found' });
  const { stop_id, name, description, category, activity_time,
          duration_minutes, cost, currency, is_paid, location_name } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'name required' });
  const { data, error } = await supabaseAdmin.from('trip_activities').insert({
    trip_id: req.params.tripId, stop_id: stop_id || null,
    name, description: description || null, category: category || 'Other',
    activity_time: activity_time || null, duration_minutes: duration_minutes || null,
    cost: parseFloat(cost) || 0, currency: currency || 'INR',
    is_paid: is_paid || false, location_name: location_name || null,
  }).select().single();
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.status(201).json({ success: true, activity: data });
});

// PATCH /api/itinerary/:tripId/activities/:actId
router.patch('/:tripId/activities/:actId', verifyToken, async (req, res) => {
  if (!await ownedTrip(req.params.tripId, req.user.id))
    return res.status(404).json({ success: false, message: 'Trip not found' });
  const allowed = ['name','description','category','activity_time','duration_minutes',
                   'cost','currency','is_paid','location_name','stop_id'];
  const updates = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  const { data, error } = await supabaseAdmin
    .from('trip_activities').update(updates).eq('id', req.params.actId).select().single();
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, activity: data });
});

// DELETE /api/itinerary/:tripId/activities/:actId
router.delete('/:tripId/activities/:actId', verifyToken, async (req, res) => {
  if (!await ownedTrip(req.params.tripId, req.user.id))
    return res.status(404).json({ success: false, message: 'Trip not found' });
  const { error } = await supabaseAdmin.from('trip_activities').delete().eq('id', req.params.actId);
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true });
});

// ── Budget ────────────────────────────────────────────────────────────────────

// GET /api/itinerary/:tripId/budget
router.get('/:tripId/budget', verifyToken, async (req, res) => {
  if (!await ownedTrip(req.params.tripId, req.user.id))
    return res.status(404).json({ success: false, message: 'Trip not found' });
  const { data, error } = await supabaseAdmin
    .from('trip_budget').select('*').eq('trip_id', req.params.tripId).single();
  if (error && error.code !== 'PGRST116')
    return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, budget: data || null });
});

// POST /api/itinerary/:tripId/budget  (upsert)
router.post('/:tripId/budget', verifyToken, async (req, res) => {
  if (!await ownedTrip(req.params.tripId, req.user.id))
    return res.status(404).json({ success: false, message: 'Trip not found' });
  const { total_budget, currency } = req.body;
  if (!total_budget) return res.status(400).json({ success: false, message: 'total_budget required' });
  const { data, error } = await supabaseAdmin.from('trip_budget').upsert({
    trip_id: req.params.tripId,
    total_budget: parseFloat(total_budget),
    currency: currency || 'INR',
  }, { onConflict: 'trip_id' }).select().single();
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, budget: data });
});

module.exports = router;
