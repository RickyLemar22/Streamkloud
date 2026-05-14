import mysqlPool from '../config/mysql.js';
import fs from 'fs';
import path from 'path';
import createEncryptedHls from '../utils/createEncryptedHls.js';

const BASE_URL = process.env.BASE_URL || 'https://api.streamkloud.me';

const toFullMediaUrl = (url) => {
  if (!url) return '';

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  return `${BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
};

const normalizeSong = (song) => ({
  ...song,
  file_url: toFullMediaUrl(song.file_url),
  url: toFullMediaUrl(song.url),
  cover_url: toFullMediaUrl(song.cover_url),
  coverUrl: toFullMediaUrl(song.coverUrl),
  coverImage: toFullMediaUrl(song.coverImage),
  cover_image: toFullMediaUrl(song.cover_image),
  artistImage: toFullMediaUrl(song.artistImage),
  artist_image: toFullMediaUrl(song.artist_image),
});

// @desc    Upload song and cover image locally, encrypt audio into HLS, then save metadata to MySQL
// @route   POST /api/songs/upload-song
// @access  Private/Admin
const uploadSong = async (req, res) => {
  console.log('--- [ENCRYPTED SONG UPLOAD CONTROLLER] ---');
  console.log('[DEBUG] Files:', Object.keys(req.files || {}).join(', '));
  console.log('[DEBUG] Body Metadata:', JSON.stringify(req.body));

  const {
    title,
    artist,
    album,
    genre,
    duration,
    release_year,
    year,
    year_of_release,
  } = req.body;

  const audioFile = req.files?.audio?.[0];
  const coverFile = req.files?.coverImage?.[0];

  if (!audioFile) {
    return res.status(400).json({
      message: 'Audio file is required',
    });
  }

  if (!title || title.trim() === '') {
    return res.status(400).json({
      message: 'Song title is required',
    });
  }

  if (!artist || artist.trim() === '') {
    return res.status(400).json({
      message: 'Artist name is required',
    });
  }

  const inputFilePath = audioFile.path;

  const coverUrl = coverFile
    ? coverFile.location || `/uploads/covers/song_covers/${coverFile.filename}`
    : null;

  const finalYearOfRelease =
    year_of_release || release_year || year || null;

  console.log('[LOCAL FILE] Raw audio saved temporarily at:', inputFilePath);
  console.log('[LOCAL FILE] Cover saved at:', coverUrl);
  console.log('[METADATA] Year of release:', finalYearOfRelease);

  let hlsResult;

  try {
    console.log('[ENCRYPTION] Starting encrypted HLS generation...');

    hlsResult = await createEncryptedHls(inputFilePath);

    console.log('[ENCRYPTION] HLS encryption completed:', hlsResult.hlsPath);

    try {
      if (fs.existsSync(inputFilePath)) {
        fs.unlinkSync(inputFilePath);
        console.log('[CLEANUP] Original raw audio deleted:', inputFilePath);
      }
    } catch (cleanupError) {
      console.warn('[CLEANUP WARNING] Could not delete raw audio:', cleanupError.message);
    }
  } catch (encryptionError) {
    console.error('[ENCRYPTION ERROR]', encryptionError);

    return res.status(500).json({
      message: `Failed to encrypt song: ${encryptionError.message}`,
      error: encryptionError.message,
    });
  }

  const connection = await mysqlPool.getConnection();

  try {
    await connection.beginTransaction();

    let artistId;

    const [existingArtists] = await connection.query(
      'SELECT id FROM artists WHERE LOWER(name) = LOWER(?) LIMIT 1',
      [artist.trim()]
    );

    if (existingArtists.length > 0) {
      artistId = existingArtists[0].id;
    } else {
      const [artistResult] = await connection.query(
        `
        INSERT INTO artists (name, profile_image, bio)
        VALUES (?, ?, ?)
        `,
        [artist.trim(), null, null]
      );

      artistId = artistResult.insertId;
    }

    let albumId = null;

    if (album && album.trim() !== '') {
      const [existingAlbums] = await connection.query(
        `
        SELECT id 
        FROM albums 
        WHERE LOWER(title) = LOWER(?) AND artist_id = ?
        LIMIT 1
        `,
        [album.trim(), artistId]
      );

      if (existingAlbums.length > 0) {
        albumId = existingAlbums[0].id;
      } else {
        const [albumResult] = await connection.query(
          `
          INSERT INTO albums (artist_id, title, release_date)
          VALUES (?, ?, ?)
          `,
          [artistId, album.trim(), null]
        );

        albumId = albumResult.insertId;
      }
    }

    const [songResult] = await connection.query(
      `
      INSERT INTO songs 
      (
        title,
        artist_id,
        album_id,
        genre,
        file_url,
        cover_url,
        duration,
        year_of_release,
        hls_path,
        encryption_key,
        key_iv
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        title.trim(),
        artistId,
        albumId,
        genre || 'Unknown',
        '',
        coverUrl,
        duration ? Math.round(Number(duration)) : 0,
        finalYearOfRelease,
        hlsResult.hlsPath,
        hlsResult.encryptionKey,
        hlsResult.iv,
      ]
    );

    const streamUrl = `/api/songs/stream/${songResult.insertId}/master.m3u8`;

    await connection.query(
      `
      UPDATE songs
      SET file_url = ?
      WHERE id = ?
      `,
      [streamUrl, songResult.insertId]
    );

    await connection.commit();

    res.status(201).json({
      id: songResult.insertId,
      title: title.trim(),
      artist: artist.trim(),
      album: album || '',
      genre: genre || 'Unknown',
      url: toFullMediaUrl(streamUrl),
      file_url: toFullMediaUrl(streamUrl),
      hls_path: hlsResult.hlsPath,
      coverUrl: toFullMediaUrl(coverUrl),
      cover_url: toFullMediaUrl(coverUrl),
      coverImage: toFullMediaUrl(coverUrl),
      cover_image: toFullMediaUrl(coverUrl),
      duration: duration ? Math.round(Number(duration)) : 0,
      year_of_release: finalYearOfRelease,
      release_year: finalYearOfRelease,
      message: 'Song uploaded, encrypted, and saved successfully',
    });
  } catch (error) {
    await connection.rollback();

    console.error('--- [ENCRYPTED SONG UPLOAD ERROR] ---');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);

    res.status(500).json({
      message: `Failed to upload encrypted song: ${error.message}`,
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

// @desc    Get all songs
// @route   GET /api/songs
// @access  Public
const getSongs = async (req, res) => {
  const { artist, album, genre, ids } = req.query;

  let sql = `
    SELECT 
      songs.id,
      songs.title,
      songs.genre,
      songs.file_url,
      songs.file_url AS url,
      songs.cover_url,
      songs.cover_url AS coverUrl,
      songs.cover_url AS coverImage,
      songs.cover_url AS cover_image,
      songs.duration,
      songs.year_of_release,
      songs.created_at,
      songs.artist_id,
      songs.album_id,
      songs.hls_path,
      artists.name AS artist,
      artists.profile_image AS artistImage,
      artists.profile_image AS artist_image,
      albums.title AS album
    FROM songs
    LEFT JOIN artists ON songs.artist_id = artists.id
    LEFT JOIN albums ON songs.album_id = albums.id
    WHERE 1 = 1
  `;

  const params = [];

  if (artist) {
    sql += ' AND artists.name = ?';
    params.push(artist);
  }

  if (album) {
    sql += ' AND albums.title = ?';
    params.push(album);
  }

  if (genre) {
    sql += ' AND songs.genre = ?';
    params.push(genre);
  }

  if (ids) {
    const idArray = ids
      .split(',')
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id));

    if (idArray.length > 0) {
      sql += ` AND songs.id IN (${idArray.map(() => '?').join(',')})`;
      params.push(...idArray);
    }
  }

  sql += ' ORDER BY songs.created_at DESC';

  const [songs] = await mysqlPool.query(sql, params);

  res.json(songs.map(normalizeSong));
};

// @desc    Get song by ID
// @route   GET /api/songs/:id
// @access  Public
const getSongById = async (req, res) => {
  const [songs] = await mysqlPool.query(
    `
    SELECT 
      songs.id,
      songs.title,
      songs.genre,
      songs.file_url,
      songs.file_url AS url,
      songs.cover_url,
      songs.cover_url AS coverUrl,
      songs.cover_url AS coverImage,
      songs.cover_url AS cover_image,
      songs.duration,
      songs.year_of_release,
      songs.created_at,
      songs.artist_id,
      songs.album_id,
      songs.hls_path,
      artists.name AS artist,
      artists.profile_image AS artistImage,
      artists.profile_image AS artist_image,
      albums.title AS album
    FROM songs
    LEFT JOIN artists ON songs.artist_id = artists.id
    LEFT JOIN albums ON songs.album_id = albums.id
    WHERE songs.id = ?
    `,
    [req.params.id]
  );

  if (songs.length === 0) {
    return res.status(404).json({
      message: 'Song not found',
    });
  }

  res.json(normalizeSong(songs[0]));
};

// @desc    Create a song manually
// @route   POST /api/songs
// @access  Private/Admin
const createSong = async (req, res) => {
  const {
    title,
    artist_id,
    album_id,
    genre,
    file_url,
    cover_url,
    coverUrl,
    duration,
    year_of_release,
    release_year,
    year,
  } = req.body;

  if (!title || !artist_id || !file_url) {
    return res.status(400).json({
      message: 'Title, artist_id, and file_url are required',
    });
  }

  const finalCoverUrl = cover_url || coverUrl || null;
  const finalYearOfRelease = year_of_release || release_year || year || null;

  const [result] = await mysqlPool.query(
    `
    INSERT INTO songs 
    (
      title,
      artist_id,
      album_id,
      genre,
      file_url,
      cover_url,
      duration,
      year_of_release
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      title,
      artist_id,
      album_id || null,
      genre || 'Unknown',
      file_url,
      finalCoverUrl,
      duration ? Math.round(Number(duration)) : 0,
      finalYearOfRelease,
    ]
  );

  res.status(201).json({
    id: result.insertId,
    title,
    artist_id,
    album_id,
    genre,
    file_url: toFullMediaUrl(file_url),
    url: toFullMediaUrl(file_url),
    cover_url: toFullMediaUrl(finalCoverUrl),
    coverUrl: toFullMediaUrl(finalCoverUrl),
    coverImage: toFullMediaUrl(finalCoverUrl),
    cover_image: toFullMediaUrl(finalCoverUrl),
    duration,
    year_of_release: finalYearOfRelease,
  });
};

// @desc    Delete a song
// @route   DELETE /api/songs/:id
// @access  Private/Admin
const deleteSong = async (req, res) => {
  const [existingSongs] = await mysqlPool.query(
    'SELECT id, hls_path FROM songs WHERE id = ?',
    [req.params.id]
  );

  if (existingSongs.length === 0) {
    return res.status(404).json({
      message: 'Song not found',
    });
  }

  const song = existingSongs[0];

  await mysqlPool.query('DELETE FROM songs WHERE id = ?', [req.params.id]);

  if (song.hls_path) {
    const hlsFullPath = path.join(process.cwd(), song.hls_path);

    try {
      if (fs.existsSync(hlsFullPath)) {
        fs.rmSync(hlsFullPath, { recursive: true, force: true });
        console.log('[DELETE] Encrypted HLS folder deleted:', hlsFullPath);
      }
    } catch (error) {
      console.warn('[DELETE WARNING] Could not delete HLS folder:', error.message);
    }
  }

  res.json({
    message: 'Song removed',
  });
};

// @desc    Update a song
// @route   PUT /api/songs/:id
// @access  Private/Admin
const updateSong = async (req, res) => {
  try {
    const {
      title,
      artist_id,
      album_id,
      genre,
      duration,
      file_url,
      year_of_release,
      release_year,
      year,
      cover_url,
      coverUrl,
    } = req.body;

    const audioFile = req.files?.audio?.[0];
    const coverFile = req.files?.coverImage?.[0];

    const [existingSongs] = await mysqlPool.query(
      'SELECT * FROM songs WHERE id = ?',
      [req.params.id]
    );

    if (existingSongs.length === 0) {
      return res.status(404).json({
        message: 'Song not found',
      });
    }

    const existingSong = existingSongs[0];

    let finalFileUrl = file_url || existingSong.file_url;
    let finalCoverUrl =
      coverFile
        ? coverFile.location || `/uploads/covers/song_covers/${coverFile.filename}`
        : cover_url || coverUrl || existingSong.cover_url;

    let finalYearOfRelease =
      year_of_release ||
      release_year ||
      year ||
      existingSong.year_of_release;

    let finalHlsPath = existingSong.hls_path;
    let finalEncryptionKey = existingSong.encryption_key;
    let finalKeyIv = existingSong.key_iv;

    if (audioFile) {
      console.log('[UPDATE ENCRYPTION] New audio uploaded. Encrypting...');

      const hlsResult = await createEncryptedHls(audioFile.path);

      finalHlsPath = hlsResult.hlsPath;
      finalEncryptionKey = hlsResult.encryptionKey;
      finalKeyIv = hlsResult.iv;
      finalFileUrl = `/api/songs/stream/${req.params.id}/master.m3u8`;

      try {
        if (fs.existsSync(audioFile.path)) {
          fs.unlinkSync(audioFile.path);
          console.log('[UPDATE CLEANUP] Raw updated audio deleted:', audioFile.path);
        }
      } catch (cleanupError) {
        console.warn('[UPDATE CLEANUP WARNING]', cleanupError.message);
      }

      if (existingSong.hls_path) {
        const oldHlsPath = path.join(process.cwd(), existingSong.hls_path);

        try {
          if (fs.existsSync(oldHlsPath)) {
            fs.rmSync(oldHlsPath, { recursive: true, force: true });
            console.log('[UPDATE CLEANUP] Old encrypted HLS deleted:', oldHlsPath);
          }
        } catch (oldCleanupError) {
          console.warn('[UPDATE CLEANUP WARNING]', oldCleanupError.message);
        }
      }
    }

    await mysqlPool.query(
      `
      UPDATE songs
      SET 
        title = ?,
        artist_id = ?,
        album_id = ?,
        genre = ?,
        file_url = ?,
        cover_url = ?,
        duration = ?,
        year_of_release = ?,
        hls_path = ?,
        encryption_key = ?,
        key_iv = ?
      WHERE id = ?
      `,
      [
        title || existingSong.title,
        artist_id || existingSong.artist_id,
        album_id !== undefined ? album_id : existingSong.album_id,
        genre || existingSong.genre,
        finalFileUrl,
        finalCoverUrl,
        duration ? Math.round(Number(duration)) : existingSong.duration,
        finalYearOfRelease,
        finalHlsPath,
        finalEncryptionKey,
        finalKeyIv,
        req.params.id,
      ]
    );

    const [updatedSongs] = await mysqlPool.query(
      `
      SELECT 
        songs.id,
        songs.title,
        songs.genre,
        songs.file_url,
        songs.file_url AS url,
        songs.cover_url,
        songs.cover_url AS coverUrl,
        songs.cover_url AS coverImage,
        songs.cover_url AS cover_image,
        songs.duration,
        songs.year_of_release,
        songs.created_at,
        songs.artist_id,
        songs.album_id,
        songs.hls_path,
        artists.name AS artist,
        artists.profile_image AS artistImage,
        artists.profile_image AS artist_image,
        albums.title AS album
      FROM songs
      LEFT JOIN artists ON songs.artist_id = artists.id
      LEFT JOIN albums ON songs.album_id = albums.id
      WHERE songs.id = ?
      `,
      [req.params.id]
    );

    res.json(normalizeSong(updatedSongs[0]));
  } catch (error) {
    console.error('Update song error:', error);

    res.status(500).json({
      message: 'Update failed',
      error: error.message,
    });
  }
};

// @desc    Get current user songs
// @route   GET /api/songs/my
// @access  Private
const getMySongs = async (req, res) => {
  const [songs] = await mysqlPool.query(`
    SELECT 
      songs.id,
      songs.title,
      songs.genre,
      songs.file_url,
      songs.file_url AS url,
      songs.cover_url,
      songs.cover_url AS coverUrl,
      songs.cover_url AS coverImage,
      songs.cover_url AS cover_image,
      songs.duration,
      songs.year_of_release,
      songs.created_at,
      songs.artist_id,
      songs.album_id,
      songs.hls_path,
      artists.name AS artist,
      artists.profile_image AS artistImage,
      artists.profile_image AS artist_image,
      albums.title AS album
    FROM songs
    LEFT JOIN artists ON songs.artist_id = artists.id
    LEFT JOIN albums ON songs.album_id = albums.id
    ORDER BY songs.created_at DESC
  `);

  res.json(songs.map(normalizeSong));
};

export {
  getSongs,
  getSongById,
  createSong,
  deleteSong,
  updateSong,
  getMySongs,
  uploadSong,
};