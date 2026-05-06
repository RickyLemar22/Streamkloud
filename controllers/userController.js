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
  const [users] = await mysqlPool.query(`
    SELECT 
      id,
      name,
      email,
      created_at
    FROM users
    ORDER BY created_at DESC
  `);

  res.json(users);
};

export { getUserProfile, getUsers };