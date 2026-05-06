import express from 'express';
import asyncHandler from 'express-async-handler';

import {
  getUserProfile,
  getUsers,
} from '../controllers/userController.js';

import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/users
router.get('/', protect, admin, asyncHandler(getUsers));

// GET /api/users/profile
router.get('/profile', protect, asyncHandler(getUserProfile));

export default router;