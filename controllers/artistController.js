import mysqlPool from '../config/mysql.js';

// @desc    Get all artists
// @route   GET /api/artists
// @access  Public
const getArtists = async (req, res) => {
  const [artists] = await mysqlPool.query(`
    SELECT id, name, profile_image AS imageUrl
    FROM artists
    ORDER BY created_at DESC
  `);

  res.json(artists);
};

// @desc    Create artist
const createArtist = async (req, res) => {
  const { name, bio, imageUrl } = req.body;

  const [result] = await mysqlPool.query(
    `
    INSERT INTO artists (name, profile_image, bio)
    VALUES (?, ?, ?)
    `,
    [name, imageUrl, bio]
  );

  res.status(201).json({
    id: result.insertId,
    name,
    bio,
    imageUrl,
  });
};

// @desc    Delete artist
const deleteArtist = async (req, res) => {
  await mysqlPool.query(
    'DELETE FROM artists WHERE id = ?',
    [req.params.id]
  );

  res.json({ message: 'Artist removed' });
};

// @desc    Update artist
const updateArtist = async (req, res) => {
  const { name, bio, imageUrl } = req.body;

  await mysqlPool.query(
    `
    UPDATE artists
    SET name = ?, profile_image = ?, bio = ?
    WHERE id = ?
    `,
    [name, imageUrl, bio, req.params.id]
  );

  res.json({ message: 'Artist updated' });
};

export {
  getArtists,
  createArtist,
  deleteArtist,
  updateArtist,
};