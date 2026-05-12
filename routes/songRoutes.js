import express from 'express';
import asyncHandler from 'express-async-handler';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import { S3Client } from '@aws-sdk/client-s3';

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

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// S3 storage configuration
const storage = multerS3({
  s3,
  bucket: process.env.AWS_S3_BUCKET,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: (req, file, cb) => {
    let folder = 'general';

    if (file.fieldname === 'audio') {
      folder = 'songs';
    } else if (file.fieldname === 'coverImage' || file.fieldname === 'image') {
      folder = 'covers/song_covers';
    }

    const ext = path.extname(file.originalname);
    const baseName = path
      .basename(file.originalname, ext)
      .replace(/\s+/g, '_')
      .replace(/[^\w.-]/g, '');

    const uniqueFileName = `${Date.now()}_${baseName}${ext}`;

    cb(null, `${folder}/${uniqueFileName}`);
  },
});

// File validation
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
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

// S3 song upload route
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