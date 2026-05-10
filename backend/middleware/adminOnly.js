const supabaseAdmin = require('../supabaseAdmin');

const adminOnly = async (req, res, next) => {
  try {
    const userId = req.user.id; // set by verifyToken middleware
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profile?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (err) {
    res.status(403).json({ error: 'Access denied' });
  }
};

module.exports = adminOnly;
