import jwt from 'jsonwebtoken';
import mysqlPool from '../config/mysql.js';

const protect = async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      message: 'Not authorized, no token provided',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.userType === 'admin') {
      const [admins] = await mysqlPool.query(
        `
        SELECT id, name, email, role
        FROM admins
        WHERE id = ?
        LIMIT 1
        `,
        [decoded.id]
      );

      if (admins.length === 0) {
        return res.status(401).json({
          message: 'Admin account no longer exists',
        });
      }

      req.user = {
        ...admins[0],
        userType: 'admin',
        isAdmin: true,
      };

      return next();
    }

    const [users] = await mysqlPool.query(
      `
      SELECT id, name, email
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: 'User account no longer exists',
      });
    }

    req.user = {
      ...users[0],
      userType: 'user',
      isAdmin: false,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Not authorized, token failed',
      error: error.message,
    });
  }
};

const admin = (req, res, next) => {
  if (
    req.user &&
    req.user.userType === 'admin' &&
    ['super_admin', 'content_manager'].includes(req.user.role)
  ) {
    return next();
  }

  return res.status(403).json({
    message: 'Admin access only',
  });
};

const superAdmin = (req, res, next) => {
  if (
    req.user &&
    req.user.userType === 'admin' &&
    req.user.role === 'super_admin'
  ) {
    return next();
  }

  return res.status(403).json({
    message: 'Super admin access only',
  });
};

export { protect, admin, superAdmin };