import express from 'express';
import fs from 'fs';
import path from 'path';

import mysqlPool from '../config/mysql.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

const getUserIdFromRequest = (req) => {
  return req.user?.id || req.user?._id || req.user?.userId;
};

const getSongForStreaming = async (songId) => {
  const [songs] = await mysqlPool.query(
    `
    SELECT 
      id,
      title,
      file_url,
      hls_path,
      encryption_key,
      key_iv
    FROM songs
    WHERE id = ?
    LIMIT 1
    `,
    [songId]
  );

  return songs.length > 0 ? songs[0] : null;
};

const getSafeHlsPath = (hlsPath, fileName) => {
  const basePath = path.resolve(process.cwd(), hlsPath || '');
  const requestedPath = path.resolve(basePath, fileName);

  if (!requestedPath.startsWith(basePath)) {
    return null;
  }

  return requestedPath;
};

const getKeyBuffer = (storedKey) => {
  if (Buffer.isBuffer(storedKey)) {
    return storedKey;
  }

  const keyString = String(storedKey || '').trim();

  // Most encrypted-HLS helpers store the AES-128 key as 32 hex characters.
  if (/^[a-fA-F0-9]{32}$/.test(keyString)) {
    return Buffer.from(keyString, 'hex');
  }

  return Buffer.from(keyString, 'utf8');
};

const verifyStreamingAccess = async (req, res) => {
  const userId = getUserIdFromRequest(req);

  if (!userId) {
    res.status(401).json({
      message: 'Please login to play this song',
    });
    return null;
  }

  const song = await getSongForStreaming(req.params.id);

  if (!song) {
    res.status(404).json({
      message: 'Song not found',
    });
    return null;
  }

  if (!song.hls_path || !song.encryption_key) {
    res.status(400).json({
      message: 'This song is not ready for protected streaming',
    });
    return null;
  }

  return song;
};

// @desc    Serve protected encrypted HLS manifest
// @route   GET /api/songs/stream/:id/master.m3u8
// @access  Private logged-in user
router.get('/songs/stream/:id/master.m3u8', protect, async (req, res) => {
  try {
    const song = await verifyStreamingAccess(req, res);
    if (!song) return;

    const token = req.query.token ? String(req.query.token) : '';
    const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : '';

    const manifestPath = getSafeHlsPath(song.hls_path, 'master.m3u8');

    if (!manifestPath || !fs.existsSync(manifestPath)) {
      return res.status(404).json({
        message: 'Stream file not found',
      });
    }

    let manifest = fs.readFileSync(manifestPath, 'utf8');

    manifest = manifest.replace(
      /URI="stream\.key"/g,
      `URI="/api/songs/stream/${song.id}/key${tokenQuery}"`
    );

    manifest = manifest.replace(
      /^(segment_[^\s]+\.ts)$/gm,
      `/api/songs/stream/${song.id}/$1${tokenQuery}`
    );

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Cache-Control', 'no-store');
    res.send(manifest);
  } catch (error) {
    console.error('[STREAM MANIFEST ERROR]', error);

    res.status(500).json({
      message: 'Unable to load song',
    });
  }
});

// @desc    Deliver AES key after login verification
// @route   GET /api/songs/stream/:id/key
// @access  Private logged-in user
router.get('/songs/stream/:id/key', protect, async (req, res) => {
  try {
    const song = await verifyStreamingAccess(req, res);
    if (!song) return;

    const keyBuffer = getKeyBuffer(song.encryption_key);

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', keyBuffer.length);
    res.setHeader('Cache-Control', 'no-store');
    res.send(keyBuffer);
  } catch (error) {
    console.error('[STREAM KEY ERROR]', error);

    res.status(500).json({
      message: 'Unable to load song key',
    });
  }
});

// @desc    Serve encrypted HLS segment
// @route   GET /api/songs/stream/:id/:segment
// @access  Private logged-in user
router.get('/songs/stream/:id/:segment', protect, async (req, res) => {
  try {
    const song = await verifyStreamingAccess(req, res);
    if (!song) return;

    const segment = req.params.segment;

    if (!/^segment_[\w.-]+\.ts$/.test(segment)) {
      return res.status(400).json({
        message: 'Invalid stream request',
      });
    }

    const segmentPath = getSafeHlsPath(song.hls_path, segment);

    if (!segmentPath || !fs.existsSync(segmentPath)) {
      return res.status(404).json({
        message: 'Stream segment not found',
      });
    }

    res.setHeader('Content-Type', 'video/mp2t');
    res.setHeader('Cache-Control', 'private, no-store');

    fs.createReadStream(segmentPath).pipe(res);
  } catch (error) {
    console.error('[STREAM SEGMENT ERROR]', error);

    res.status(500).json({
      message: 'Unable to stream song',
    });
  }
});

export default router;
