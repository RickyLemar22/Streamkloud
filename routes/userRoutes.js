import express from 'express';
import asyncHandler from 'express-async-handler';

import {
  getUserProfile,
  getUsers,
  deleteUser,
  toggleBanUser,
} from '../controllers/userController.js';

import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/users
router.get('/', protect, admin, asyncHandler(getUsers));

// DELETE /api/users/:id
router.delete('/:id', protect, admin, asyncHandler(deleteUser));

// POST /api/users/:id/ban
router.post('/:id/ban', protect, admin, asyncHandler(toggleBanUser));

// GET /api/users/profile
router.get('/profile', protect, asyncHandler(getUserProfile));

export default router;