import multer from 'multer';
import path from 'path';
import fs from 'fs';

const songsDir = 'uploads/songs';
const coversDir = 'uploads/covers';

if (!fs.existsSync(songsDir)) {
  fs.mkdirSync(songsDir, { recursive: true });
}

if (!fs.existsSync(coversDir)) {
  fs.mkdirSync(coversDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'audio') {
      cb(null, songsDir);
    } else if (file.fieldname === 'coverImage') {
      cb(null, coversDir);
    } else {
      cb(null, 'uploads');
    }
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      '_' +
      file.originalname
        .replace(/\s+/g, '_')
        .replace(/[^\w.-]/g, '');

    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'audio') {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'), false);
    }
  } else if (file.fieldname === 'coverImage') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  } else {
    cb(new Error('Invalid file field'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

export default upload;