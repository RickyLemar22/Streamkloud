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

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5000';

// Existing auth routes
router.post('/register', asyncHandler(registerUser));
router.post('/login', asyncHandler(authUser));
router.post('/admin-login', asyncHandler(adminLogin));

router.post('/send-verification', asyncHandler(sendVerificationCode));
router.post('/verify-code', asyncHandler(verifyCode));

router.post('/forgot-password', asyncHandler(forgotPassword));
router.post('/reset-password', asyncHandler(resetPassword));

// Google Auth - start login
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
    session: false,
  })
);

// Google Auth - callback
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${FRONTEND_URL}/`,
  }),
  (req, res) => {
    const { token, user } = req.user;

    const encodedUser = encodeURIComponent(JSON.stringify(user));

    return res.redirect(
      `${FRONTEND_URL}/auth-success?token=${token}&user=${encodedUser}`
    );
  }
);

export default router;