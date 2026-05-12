import express from 'express';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';

import { uploadFile } from '../controllers/uploadController.js';
import { protect } from '../middleware/authMiddleware.js';
import { s3, S3_BUCKET } from '../utils/s3.js';

const router = express.Router();

const allowedFolders = ['general', 'covers', 'songs'];

const getS3Folder = (req) => {
  const requestedFolder = req.body.folder || 'general';

  if (!allowedFolders.includes(requestedFolder)) {
    return 'general';
  }

  return requestedFolder;
};

const storage = multerS3({
  s3,
  bucket: S3_BUCKET,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: (req, file, cb) => {
    const folder = getS3Folder(req);

    const ext = path.extname(file.originalname);
    const baseName = path
      .basename(file.originalname, ext)
      .replace(/\s+/g, '_')
      .replace(/[^\w.-]/g, '');

    const uniqueFileName = `${Date.now()}_${baseName}${ext}`;

    req.uploadFolder = folder;

    cb(null, `${folder}/${uniqueFileName}`);
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