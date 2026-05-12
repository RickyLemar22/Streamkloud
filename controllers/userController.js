import mysqlPool from '../config/mysql.js';

// @desc    Get logged-in user/admin profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      message: 'Not authorized',
    });
  }

  if (req.user.userType === 'admin') {
    return res.json({
      id: req.user.id,
      _id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      userType: 'admin',
      isAdmin: true,
    });
  }

  const [users] = await mysqlPool.query(
    `
    SELECT id, name, email, created_at
    FROM users
    WHERE id = ?
    LIMIT 1
    `,
    [req.user.id]
  );

  if (users.length === 0) {
    return res.status(404).json({
      message: 'User not found',
    });
  }

  const user = users[0];

  res.json({
    id: user.id,
    _id: user.id,
    name: user.name,
    email: user.email,
    role: 'user',
    userType: 'user',
    created_at: user.created_at,
  });
};

// @desc    Get all users for admin dashboard
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  // Try to include banned status if the banned_users table exists; fall back if not
  try {
    const [users] = await mysqlPool.query(`
      SELECT u.id, u.name, u.email, u.created_at, IF(b.user_id IS NULL, 0, 1) AS banned
      FROM users u
      LEFT JOIN (
        SELECT user_id FROM banned_users
      ) b ON b.user_id = u.id
      ORDER BY u.created_at DESC
    `);

    res.json(users);
  } catch (err) {
    console.warn('Could not join banned_users table, returning basic users list:', err.message);
    const [users] = await mysqlPool.query(`
      SELECT id, name, email, created_at
      FROM users
      ORDER BY created_at DESC
    `);
    res.json(users.map(u => ({ ...u, banned: 0 })));
  }
};

// @desc    Delete a user (admin)
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  const userId = req.params.id;
  await mysqlPool.query('DELETE FROM users WHERE id = ?', [userId]);
  // Also remove any ban record
  try {
    await mysqlPool.query('DELETE FROM banned_users WHERE user_id = ?', [userId]);
  } catch (e) {
    // ignore if table doesn't exist
  }
  res.json({ message: 'User deleted' });
};

// @desc    Toggle ban/unban a user (admin)
// @route   POST /api/users/:id/ban
// @access  Private/Admin
const toggleBanUser = async (req, res) => {
  const userId = req.params.id;

  // ensure banned_users table exists
  await mysqlPool.query(`
    CREATE TABLE IF NOT EXISTS banned_users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      banned_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  const [rows] = await mysqlPool.query('SELECT id FROM banned_users WHERE user_id = ? LIMIT 1', [userId]);
  if (rows.length > 0) {
    await mysqlPool.query('DELETE FROM banned_users WHERE user_id = ?', [userId]);
    return res.json({ message: 'User unbanned', banned: false });
  }
  await mysqlPool.query('INSERT INTO banned_users (user_id) VALUES (?)', [userId]);
  res.json({ message: 'User banned', banned: true });
};

export { getUserProfile, getUsers, deleteUser, toggleBanUser };
