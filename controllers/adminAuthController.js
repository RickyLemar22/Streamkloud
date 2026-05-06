import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mysqlPool from '../config/mysql.js';

const generateToken = (admin) => {
  return jwt.sign(
    {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      userType: 'admin',
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

// @desc    Admin login using MySQL admins table
// @route   POST /api/auth/admin-login
// @access  Public
const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: 'Email and password are required',
    });
  }

  const [admins] = await mysqlPool.query(
    `
    SELECT id, name, email, password, role, created_at
    FROM admins
    WHERE email = ?
    LIMIT 1
    `,
    [email]
  );

  if (admins.length === 0) {
    return res.status(401).json({
      message: 'Invalid admin email or password',
    });
  }

  const admin = admins[0];

  const passwordMatches = await bcrypt.compare(password, admin.password);

  if (!passwordMatches) {
    return res.status(401).json({
      message: 'Invalid admin email or password',
    });
  }

  const token = generateToken(admin);

  res.json({
    message: 'Admin login successful',
    token,
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
  });
};

export { adminLogin };