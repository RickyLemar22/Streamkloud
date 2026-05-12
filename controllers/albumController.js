import { pool } from '../config/mysql.js';

// @desc    Get all albums
// @route   GET /api/albums
// @access  Public
const getAlbums = async (req, res) => {
  const [albums] = await pool.query(`
    SELECT 
      albums.id,
      albums.artist_id,
      albums.title,
      albums.cover_url,
      albums.release_date,
      albums.created_at,
      artists.name AS artist
    FROM albums
    LEFT JOIN artists ON albums.artist_id = artists.id
    ORDER BY albums.created_at DESC
  `);

  res.json(albums);
};

// @desc    Create an album
// @route   POST /api/albums
// @access  Private/Admin
const createAlbum = async (req, res) => {
  const { title, artist_id, artistId, coverUrl, cover_url, release_date, releaseYear } =
    req.body;

  const finalArtistId = artist_id || artistId;
  const finalCoverUrl = coverUrl || cover_url || null;
  const finalReleaseDate = release_date || releaseYear || null;

  if (!title || !finalArtistId) {
    res.status(400);
    throw new Error('Album title and artist are required.');
  }

  const [result] = await pool.query(
    `
    INSERT INTO albums 
      (title, artist_id, cover_url, release_date)
    VALUES 
      (?, ?, ?, ?)
    `,
    [title, finalArtistId, finalCoverUrl, finalReleaseDate]
  );

  const [createdAlbum] = await pool.query(
    `
    SELECT 
      albums.id,
      albums.artist_id,
      albums.title,
      albums.cover_url,
      albums.release_date,
      albums.created_at,
      artists.name AS artist
    FROM albums
    LEFT JOIN artists ON albums.artist_id = artists.id
    WHERE albums.id = ?
    `,
    [result.insertId]
  );

  res.status(201).json(createdAlbum[0]);
};

// @desc    Delete an album
// @route   DELETE /api/albums/:id
// @access  Private/Admin
const deleteAlbum = async (req, res) => {
  const [existingAlbum] = await pool.query(
    'SELECT id FROM albums WHERE id = ?',
    [req.params.id]
  );

  if (existingAlbum.length === 0) {
    res.status(404);
    throw new Error('Album not found');
  }

  await pool.query('DELETE FROM albums WHERE id = ?', [req.params.id]);

  res.json({ message: 'Album removed' });
};

// @desc    Update an album
// @route   PUT /api/albums/:id
// @access  Private/Admin
const updateAlbum = async (req, res) => {
  const { title, artist_id, artistId, coverUrl, cover_url, release_date, releaseYear } =
    req.body;

  const [existingAlbum] = await pool.query(
    'SELECT * FROM albums WHERE id = ?',
    [req.params.id]
  );

  if (existingAlbum.length === 0) {
    res.status(404);
    throw new Error('Album not found');
  }

  const album = existingAlbum[0];

  const updatedTitle = title || album.title;
  const updatedArtistId = artist_id || artistId || album.artist_id;
  const updatedCoverUrl = coverUrl || cover_url || album.cover_url;
  const updatedReleaseDate = release_date || releaseYear || album.release_date;

  await pool.query(
    `
    UPDATE albums
    SET 
      title = ?,
      artist_id = ?,
      cover_url = ?,
      release_date = ?
    WHERE id = ?
    `,
    [
      updatedTitle,
      updatedArtistId,
      updatedCoverUrl,
      updatedReleaseDate,
      req.params.id,
    ]
  );

  const [updatedAlbum] = await pool.query(
    `
    SELECT 
      albums.id,
      albums.artist_id,
      albums.title,
      albums.cover_url,
      albums.release_date,
      albums.created_at,
      artists.name AS artist
    FROM albums
    LEFT JOIN artists ON albums.artist_id = artists.id
    WHERE albums.id = ?
    `,
    [req.params.id]
  );

  res.json(updatedAlbum[0]);
};

// @desc    Get album by title
// @route   GET /api/albums/title/:title
// @access  Public
const getAlbumByTitle = async (req, res) => {
  const [albums] = await pool.query(
    `
    SELECT 
      albums.id,
      albums.artist_id,
      albums.title,
      albums.cover_url,
      albums.release_date,
      albums.created_at,
      artists.name AS artist
    FROM albums
    LEFT JOIN artists ON albums.artist_id = artists.id
    WHERE albums.title = ?
    LIMIT 1
    `,
    [req.params.title]
  );

  if (albums.length === 0) {
    res.status(404);
    throw new Error('Album not found');
  }

  res.json(albums[0]);
};

export {
  getAlbums,
  createAlbum,
  deleteAlbum,
  updateAlbum,
  getAlbumByTitle,
};