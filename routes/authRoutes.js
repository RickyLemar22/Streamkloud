import express from 'express';
import asyncHandler from 'express-async-handler';
import passport from '../config/googleAuth.js';

import {
  registerUser,
  authUser,
  sendVerificationCode,
  verifyCode,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';

import { adminLogin } from '../controllers/adminAuthController.js';

const router = express.Router();

router.post('/register', asyncHandler(registerUser));
router.post('/login', asyncHandler(authUser));
router.post('/admin-login', asyncHandler(adminLogin));

router.post('/send-verification', asyncHandler(sendVerificationCode));
router.post('/verify-code', asyncHandler(verifyCode));

router.post('/forgot-password', asyncHandler(forgotPassword));
router.post('/reset-password', asyncHandler(resetPassword));

router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/`,
  }),
  (req, res) => {
    const { token, user } = req.user;
    const encodedUser = encodeURIComponent(JSON.stringify(user));

    res.redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth-success?token=${token}&user=${encodedUser}`
    );
  }
);

export default router;