import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { pool } from './mysql.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const googleId = profile.id;
        const name =
          profile.displayName || email?.split('@')[0] || 'Google User';
        const photoURL = profile.photos?.[0]?.value || '';

        if (!email) {
          return done(null, false, {
            message: 'Google account email was not found',
          });
        }

        const [rows] = await pool.query(
          'SELECT * FROM users WHERE email = ? LIMIT 1',
          [email]
        );

        let user;

        if (rows.length > 0) {
          user = rows[0];

          await pool.query(
            `UPDATE users 
             SET google_id = ?, 
                 auth_provider = 'google', 
                 is_verified = 1 
             WHERE id = ?`,
            [googleId, user.id]
          );

          user = {
            ...user,
            google_id: googleId,
            auth_provider: 'google',
            is_verified: 1,
          };
        } else {
          const randomPassword = `${googleId}-${Date.now()}-${process.env.JWT_SECRET}`;
          const hashedPassword = await bcrypt.hash(randomPassword, 10);

          const [result] = await pool.query(
            `INSERT INTO users 
             (name, email, password, google_id, auth_provider, is_verified) 
             VALUES (?, ?, ?, ?, 'google', 1)`,
            [name, email, hashedPassword, googleId]
          );

          user = {
            id: result.insertId,
            name,
            email,
            role: 'user',
            userType: 'user',
            photoURL,
            google_id: googleId,
            auth_provider: 'google',
            is_verified: 1,
          };
        }

        const token = jwt.sign(
          {
            id: user.id,
            email: user.email,
            role: user.role || 'user',
            userType: user.userType || 'user',
          },
          process.env.JWT_SECRET,
          { expiresIn: '30d' }
        );

        return done(null, {
          token,
          user: {
            id: user.id,
            name: user.name || name,
            displayName: user.name || name,
            email: user.email,
            role: user.role || 'user',
            userType: user.userType || 'user',
            photoURL: user.photoURL || photoURL,
          },
        });
      } catch (error) {
        console.error('Google Auth Error:', error);
        return done(error, null);
      }
    }
  )
);

export default passport;