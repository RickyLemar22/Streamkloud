import express from 'express';
import fs from 'fs';
import path from 'path';

import mysqlPool from '../config/mysql.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

const getUserIdFromRequest = (req) => {
  return req.user?.id || req.user?._id || req.user?.userId;
};

const hasActiveSubscription = async (userId) => {
  const [rows] = await mysqlPool.query(
    `
    SELECT 
      us.id,
      us.user_id,
      us.plan_id,
      us.status,
      us.start_date,
      us.end_date,
      sp.name AS plan_name,
      sp.billing_cycle
    FROM user_subscriptions us
    INNER JOIN subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = ?
      AND us.status = 'active'
      AND us.start_date <= NOW()
      AND (us.end_date IS NULL OR us.end_date > NOW())
    LIMIT 1
    `,
    [userId]
  );

  return rows.length > 0;
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

const verifyStreamingAccess = async (req, res) => {
  const userId = getUserIdFromRequest(req);

  if (!userId) {
    res.status(401).json({
      message: 'Authentication required',
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
      message: 'This song is not yet available as a protected encrypted stream',
    });
    return null;
  }

  const allowed = await hasActiveSubscription(userId);

  if (!allowed) {
    res.status(403).json({
      message: 'Active subscription required to stream this song',
    });
    return null;
  }

  return song;
};

// @desc    Serve protected encrypted HLS manifest
// @route   GET /api/songs/stream/:id/master.m3u8
// @access  Private/Subscribed
router.get('/songs/stream/:id/master.m3u8', protect, async (req, res) => {
  try {
    const song = await verifyStreamingAccess(req, res);
    if (!song) return;

    const manifestPath = path.join(
      process.cwd(),
      song.hls_path,
      'master.m3u8'
    );

    if (!fs.existsSync(manifestPath)) {
      return res.status(404).json({
        message: 'Manifest file not found',
      });
    }

    let manifest = fs.readFileSync(manifestPath, 'utf8');

    manifest = manifest.replace(
      /URI="stream\.key"/g,
      `URI="/api/songs/stream/${song.id}/key"`
    );

    manifest = manifest.replace(
      /^(segment_[^\s]+\.ts)$/gm,
      `/api/songs/stream/${song.id}/$1`
    );

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Cache-Control', 'no-store');
    res.send(manifest);
  } catch (error) {
    console.error('[STREAM MANIFEST ERROR]', error);

    res.status(500).json({
      message: 'Failed to load stream manifest',
      error: error.message,
    });
  }
});

// @desc    Deliver AES key after subscription verification
// @route   GET /api/songs/stream/:id/key
// @access  Private/Subscribed
router.get('/songs/stream/:id/key', protect, async (req, res) => {
  try {
    const song = await verifyStreamingAccess(req, res);
    if (!song) return;

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store');
    res.send(song.encryption_key);
  } catch (error) {
    console.error('[STREAM KEY ERROR]', error);

    res.status(500).json({
      message: 'Failed to deliver stream key',
      error: error.message,
    });
  }
});

// @desc    Serve encrypted HLS segment
// @route   GET /api/songs/stream/:id/:segment
// @access  Private/Subscribed
router.get('/songs/stream/:id/:segment', protect, async (req, res) => {
  try {
    const song = await verifyStreamingAccess(req, res);
    if (!song) return;

    const segment = req.params.segment;

    if (!/^segment_\d+\.ts$/.test(segment)) {
      return res.status(400).json({
        message: 'Invalid segment request',
      });
    }

    const segmentPath = path.join(
      process.cwd(),
      song.hls_path,
      segment
    );

    if (!fs.existsSync(segmentPath)) {
      return res.status(404).json({
        message: 'Segment not found',
      });
    }

    res.setHeader('Content-Type', 'video/mp2t');
    res.setHeader('Cache-Control', 'private, no-store');

    fs.createReadStream(segmentPath).pipe(res);
  } catch (error) {
    console.error('[STREAM SEGMENT ERROR]', error);

    res.status(500).json({
      message: 'Failed to stream segment',
      error: error.message,
    });
  }
});

export default router;