import express from 'express';
import asyncHandler from 'express-async-handler';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

import {
  getSongs,
  getSongById,
  createSong,
  deleteSong,
  updateSong,
  getMySongs,
  uploadSong,
} from '../controllers/songController.js';

import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Ensure local upload folders exist
const songsDir = path.join(process.cwd(), 'uploads', 'songs');
const coversDir = path.join(process.cwd(), 'uploads', 'covers');

if (!fs.existsSync(songsDir)) {
  fs.mkdirSync(songsDir, { recursive: true });
}

if (!fs.existsSync(coversDir)) {
  fs.mkdirSync(coversDir, { recursive: true });
}

// Local disk storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'audio') {
      cb(null, songsDir);
    } else if (file.fieldname === 'coverImage' || file.fieldname === 'image') {
      cb(null, coversDir);
    } else {
      cb(null, path.join(process.cwd(), 'uploads'));
    }
  },

  filename: (req, file, cb) => {
    const safeOriginalName = file.originalname
      .replace(/\s+/g, '_')
      .replace(/[^\w.-]/g, '');

    const uniqueFileName = `${Date.now()}_${safeOriginalName}`;

    cb(null, uniqueFileName);
  },
});

// File validation
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    console.log(`Checking file: ${file.originalname} (${file.mimetype})`);

    if (file.fieldname === 'audio') {
      const allowedAudioTypes = [
        'audio/mpeg',
        'audio/wav',
        'audio/wave',
        'audio/mp3',
        'audio/x-wav',
      ];

      if (
        allowedAudioTypes.includes(file.mimetype) ||
        file.originalname.toLowerCase().endsWith('.mp3') ||
        file.originalname.toLowerCase().endsWith('.wav')
      ) {
        cb(null, true);
      } else {
        cb(new Error('Invalid audio file type. Only MP3 and WAV are allowed.'), false);
      }
    } else if (file.fieldname === 'coverImage' || file.fieldname === 'image') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Invalid image file type.'), false);
      }
    } else {
      cb(new Error('Invalid upload field.'), false);
    }
  },
});

router
  .route('/')
  .get(asyncHandler(getSongs))
  .post(protect, admin, asyncHandler(createSong));

// Local song upload route
router.post(
  '/upload-song',
  protect,
  admin,
  (req, res, next) => {
    upload.fields([
      { name: 'audio', maxCount: 1 },
      { name: 'coverImage', maxCount: 1 },
    ])(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        console.error('Multer Error:', err);
        return res.status(400).json({
          message: `Upload error: ${err.message}`,
          code: err.code,
        });
      }

      if (err) {
        console.error('File Filter Error:', err);
        return res.status(400).json({
          message: err.message,
        });
      }

      next();
    });
  },
  asyncHandler(uploadSong)
);

router.get('/my', protect, asyncHandler(getMySongs));

router
  .route('/:id')
  .get(asyncHandler(getSongById))
  .delete(protect, admin, asyncHandler(deleteSong))
  .put(
    protect,
    admin,
    (req, res, next) => {
      upload.fields([
        { name: 'audio', maxCount: 1 },
        { name: 'coverImage', maxCount: 1 },
      ])(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({
            message: `Upload error: ${err.message}`,
          });
        }

        if (err) {
          return res.status(400).json({
            message: err.message,
          });
        }

        next();
      });
    },
    asyncHandler(updateSong)
  );

export default router;