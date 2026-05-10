const express = require('express');
const router = express.Router();
const supabaseAdmin = require('../supabaseAdmin');
const verifyToken = require('../middleware/verifyToken');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { first_name, last_name, email, password, phone, city, country, additional_info, avatar_url } = req.body;

  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Required fields missing' });
  }

  // Create auth user with email already confirmed
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    const message = authError.message.includes('already been registered') || authError.message.includes('already registered')
      ? 'Email is already registered'
      : authError.message;
    return res.status(400).json({ success: false, message });
  }

  // Insert profile row
  const { error: profileError } = await supabaseAdmin.from('profiles').insert({
    id: authData.user.id,
    first_name,
    last_name,
    email,
    phone: phone || null,
    city: city || null,
    country: country || null,
    additional_info: additional_info || null,
    avatar_url: avatar_url || null,
  });

  if (profileError) {
    console.error('Profile insert error:', profileError);
    return res.status(500).json({ success: false, message: 'Profile creation failed: ' + profileError.message, detail: profileError.details, hint: profileError.hint });
  }

  return res.status(201).json({ success: true, message: 'Account created successfully' });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });

  if (error) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  return res.json({ success: true, session: data.session, user: data.user });
});

// POST /api/auth/logout
router.post('/logout', verifyToken, async (req, res) => {
  const { error } = await supabaseAdmin.auth.admin.signOut(req.user.id);
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', verifyToken, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', req.user.id)
    .single();

  if (error) return res.status(404).json({ success: false, message: 'Profile not found' });
  return res.json({ success: true, user: data });
});

// PATCH /api/profile
router.patch('/profile', verifyToken, async (req, res) => {
  const allowedFields = ['first_name','last_name','phone','city','country','additional_info','avatar_url'];
  const updates = {};
  allowedFields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  if (Object.keys(updates).length === 0)
    return res.status(400).json({ success: false, message: 'No valid fields to update' });
  const { data, error } = await supabaseAdmin
    .from('profiles').update(updates).eq('id', req.user.id).select().single();
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, profile: data });
});

// DELETE /api/profile
router.delete('/profile', verifyToken, async (req, res) => {
  const userId = req.user.id;
  await supabaseAdmin.from('profiles').delete().eq('id', userId);
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, message: 'Account deleted' });
});

module.exports = router;
