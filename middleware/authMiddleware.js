import jwt from 'jsonwebtoken';
import mysqlPool from '../config/mysql.js';

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  // Needed for HLS playback because browsers/HLS segment requests cannot always
  // attach Authorization headers to .m3u8, .key and .ts files.
  if (req.query?.token && typeof req.query.token === 'string') {
    return req.query.token;
  }

  return null;
};

const protect = async (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({
      message: 'Please login to continue',
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
          message: 'Please login again',
        });
      }

      req.user = {
        ...admins[0],
        userType: 'admin',
        isAdmin: true,
      };

      return next();
    }

    if (decoded && decoded.id && decoded.email && decoded.name) {
      req.user = {
        id: decoded.id,
        name: decoded.name,
        email: decoded.email,
        role: decoded.role || 'user',
        userType: decoded.userType || 'user',
        isAdmin: false,
        is_verified: decoded.is_verified === 1 || decoded.is_verified === true,
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
        message: 'Please login again',
      });
    }

    req.user = {
      ...users[0],
      role: 'user',
      userType: 'user',
      isAdmin: false,
    };

    return next();
  } catch (error) {
    return res.status(401).json({
      message: 'Your session has expired. Please login again',
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
