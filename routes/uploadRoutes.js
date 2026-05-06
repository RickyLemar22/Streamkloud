import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

import { uploadFile } from '../controllers/uploadController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

const generalUploadsDir = path.join(process.cwd(), 'uploads', 'general');

if (!fs.existsSync(generalUploadsDir)) {
  fs.mkdirSync(generalUploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, generalUploadsDir);
  },

  filename: (req, file, cb) => {
    const safeOriginalName = file.originalname
      .replace(/\s+/g, '_')
      .replace(/[^\w.-]/g, '');

    const uniqueFileName = `${Date.now()}_${safeOriginalName}`;

    cb(null, uniqueFileName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 30 * 1024 * 1024,
  },
});

router.post('/', protect, upload.single('file'), uploadFile);

export default router;