const express = require('express');
const router = express.Router();
const supabaseAdmin = require('../supabaseAdmin');
const verifyToken = require('../middleware/verifyToken');

const PAGE_SIZE = 10;

// ── helpers ───────────────────────────────────────────────────────────────────
async function bumpCount(table, id, field, delta) {
  const { data } = await supabaseAdmin.from(table).select(field).eq('id', id).single();
  if (!data) return;
  await supabaseAdmin.from(table).update({ [field]: (data[field] || 0) + delta }).eq('id', id);
}

// GET /api/community
router.get('/', async (req, res) => {
  const { search = '', tag = '', sort = 'recent', page = 1 } = req.query;
  const from = (parseInt(page) - 1) * PAGE_SIZE;
  const to   = from + PAGE_SIZE - 1;

  let query = supabaseAdmin
    .from('community_posts')
    .select(
      'id,title,content,tags,like_count,comment_count,copy_count,created_at,trip_id,user_id',
      { count: 'exact' }
    )
    .eq('is_public', true)
    .range(from, to);

  if (search) query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
  if (tag)    query = query.contains('tags', [tag]);

  switch (sort) {
    case 'liked':     query = query.order('like_count',    { ascending: false }); break;
    case 'commented': query = query.order('comment_count', { ascending: false }); break;
    case 'copied':    query = query.order('copy_count',    { ascending: false }); break;
    default:          query = query.order('created_at',    { ascending: false });
  }

  const { data: posts, error, count } = await query;
  if (error) return res.status(500).json({ success: false, message: error.message });

  // attach profile info
  const userIds = [...new Set((posts || []).map(p => p.user_id))];
  let profileMap = {};
  if (userIds.length) {
    const { data: profiles } = await supabaseAdmin
      .from('profiles').select('id,first_name,last_name,avatar_url').in('id', userIds);
    (profiles || []).forEach(p => { profileMap[p.id] = p; });
  }

  const enriched = (posts || []).map(p => ({ ...p, profile: profileMap[p.user_id] || null }));
  return res.json({ success: true, posts: enriched, total: count || 0, page: parseInt(page), pageSize: PAGE_SIZE });
});

// GET /api/community/:id/comments
router.get('/:id/comments', async (req, res) => {
  const { data: rawComments } = await supabaseAdmin
    .from('community_comments').select('id,content,created_at,user_id')
    .eq('post_id', req.params.id).order('created_at', { ascending: true });

  const commentUserIds = [...new Set((rawComments || []).map(c => c.user_id))];
  let cProfileMap = {};
  if (commentUserIds.length) {
    const { data: cProfiles } = await supabaseAdmin
      .from('profiles').select('id,first_name,last_name,avatar_url').in('id', commentUserIds);
    (cProfiles || []).forEach(p => { cProfileMap[p.id] = p; });
  }
  const comments = (rawComments || []).map(c => ({ ...c, profile: cProfileMap[c.user_id] || null }));
  return res.json({ success: true, comments });
});

// GET /api/community/:id
router.get('/:id', async (req, res) => {
  const { data: post, error } = await supabaseAdmin
    .from('community_posts').select('*').eq('id', req.params.id).eq('is_public', true).single();
  if (error || !post) return res.status(404).json({ success: false, message: 'Post not found' });

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('id,first_name,last_name,avatar_url').eq('id', post.user_id).single();

  const { data: rawComments } = await supabaseAdmin
    .from('community_comments').select('id,content,created_at,user_id')
    .eq('post_id', req.params.id).order('created_at', { ascending: true });

  const commentUserIds = [...new Set((rawComments || []).map(c => c.user_id))];
  let cProfileMap = {};
  if (commentUserIds.length) {
    const { data: cProfiles } = await supabaseAdmin
      .from('profiles').select('id,first_name,last_name,avatar_url').in('id', commentUserIds);
    (cProfiles || []).forEach(p => { cProfileMap[p.id] = p; });
  }
  const comments = (rawComments || []).map(c => ({ ...c, profile: cProfileMap[c.user_id] || null }));

  return res.json({ success: true, post: { ...post, profile }, comments });
});

// POST /api/community
router.post('/', verifyToken, async (req, res) => {
  const { trip_id, title, content, tags } = req.body;
  if (!title || !content) return res.status(400).json({ success: false, message: 'title and content required' });
  const { data, error } = await supabaseAdmin.from('community_posts').insert({
    user_id: req.user.id, trip_id: trip_id || null,
    title, content, tags: Array.isArray(tags) ? tags : [],
  }).select().single();
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.status(201).json({ success: true, post: data });
});

// POST /api/community/:id/like  — toggle
router.post('/:id/like', verifyToken, async (req, res) => {
  const { id: postId } = req.params;
  const userId = req.user.id;
  const { data: existing } = await supabaseAdmin
    .from('community_likes').select('id').eq('post_id', postId).eq('user_id', userId).single();
  if (existing) {
    await supabaseAdmin.from('community_likes').delete().eq('id', existing.id);
    await bumpCount('community_posts', postId, 'like_count', -1);
    return res.json({ success: true, liked: false });
  }
  await supabaseAdmin.from('community_likes').insert({ post_id: postId, user_id: userId });
  await bumpCount('community_posts', postId, 'like_count', 1);
  return res.json({ success: true, liked: true });
});

// GET /api/community/:id/liked  — check if current user liked
router.get('/:id/liked', verifyToken, async (req, res) => {
  const { data } = await supabaseAdmin
    .from('community_likes').select('id').eq('post_id', req.params.id).eq('user_id', req.user.id).single();
  return res.json({ success: true, liked: !!data });
});

// POST /api/community/:id/comment
router.post('/:id/comment', verifyToken, async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ success: false, message: 'content required' });
  const { data, error } = await supabaseAdmin.from('community_comments').insert({
    post_id: req.params.id, user_id: req.user.id, content: content.trim(),
  }).select('id,content,created_at,user_id').single();
  if (error) return res.status(500).json({ success: false, message: error.message });
  await bumpCount('community_posts', req.params.id, 'comment_count', 1);
  const { data: profile } = await supabaseAdmin
    .from('profiles').select('id,first_name,last_name,avatar_url').eq('id', req.user.id).single();
  return res.status(201).json({ success: true, comment: { ...data, profile } });
});

// DELETE /api/community/comments/:commentId
router.delete('/comments/:commentId', verifyToken, async (req, res) => {
  const { data: comment } = await supabaseAdmin
    .from('community_comments').select('id,post_id').eq('id', req.params.commentId).eq('user_id', req.user.id).single();
  if (!comment) return res.status(404).json({ success: false, message: 'Not found' });
  await supabaseAdmin.from('community_comments').delete().eq('id', req.params.commentId);
  await bumpCount('community_posts', comment.post_id, 'comment_count', -1);
  return res.json({ success: true });
});

// POST /api/community/:id/copy
router.post('/:id/copy', verifyToken, async (req, res) => {
  const { data: post } = await supabaseAdmin
    .from('community_posts').select('trip_id').eq('id', req.params.id).single();
  if (!post?.trip_id) return res.status(404).json({ success: false, message: 'No trip linked' });

  const { data: src } = await supabaseAdmin.from('trips').select('*').eq('id', post.trip_id).single();
  if (!src) return res.status(404).json({ success: false, message: 'Source trip not found' });

  const { data: newTrip, error } = await supabaseAdmin.from('trips').insert({
    user_id: req.user.id, name: `${src.name} (Copy)`,
    description: src.description, start_date: src.start_date,
    end_date: src.end_date, status: 'upcoming',
    cover_photo: src.cover_photo, destination_count: src.destination_count,
  }).select().single();
  if (error) return res.status(500).json({ success: false, message: error.message });

  // copy itinerary days + activities
  const { data: srcDays } = await supabaseAdmin
    .from('itinerary_days').select('*').eq('trip_id', post.trip_id).order('day_number');
  if (srcDays?.length) {
    for (const day of srcDays) {
      const { data: newDay } = await supabaseAdmin.from('itinerary_days').insert({
        trip_id: newTrip.id, day_number: day.day_number,
        date: day.date, city: day.city, notes: day.notes,
      }).select().single();
      if (newDay) {
        const { data: acts } = await supabaseAdmin
          .from('activities').select('*').eq('day_id', day.id);
        if (acts?.length) {
          await supabaseAdmin.from('activities').insert(
            acts.map(a => ({
              day_id: newDay.id, name: a.name, type: a.type,
              start_time: a.start_time, end_time: a.end_time,
              location: a.location, cost: a.cost, notes: a.notes,
            }))
          );
        }
      }
    }
  }

  await bumpCount('community_posts', req.params.id, 'copy_count', 1);
  return res.json({ success: true, trip: newTrip });
});

module.exports = router;
