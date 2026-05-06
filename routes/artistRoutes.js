import express from 'express';

import {
  getArtists,
  createArtist,
  deleteArtist,
  updateArtist,
} from '../controllers/artistController.js';

import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getArtists);
router.post('/', protect, admin, createArtist);
router.put('/:id', protect, admin, updateArtist);
router.delete('/:id', protect, admin, deleteArtist);

export default router;