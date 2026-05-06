import Album from '../models/Album.js';

// @desc    Get all albums
// @route   GET /api/albums
// @access  Public
const getAlbums = async (req, res) => {
  const albums = await Album.find({});
  res.json(albums);
};

// @desc    Create an album
// @route   POST /api/albums
// @access  Private
const createAlbum = async (req, res) => {
  const { title, artist, artistId, coverUrl, releaseYear } = req.body;

  const album = new Album({
    title,
    artist,
    artistId,
    coverUrl,
    releaseYear,
  });

  const createdAlbum = await album.save();
  res.status(201).json(createdAlbum);
};

// @desc    Delete an album
// @route   DELETE /api/albums/:id
// @access  Private/Admin
const deleteAlbum = async (req, res) => {
  const album = await Album.findById(req.params.id);

  if (album) {
    await album.deleteOne();
    res.json({ message: 'Album removed' });
  } else {
    res.status(404).json({ message: 'Album not found' });
  }
};

// @desc    Update an album
// @route   PUT /api/albums/:id
// @access  Private/Admin
const updateAlbum = async (req, res) => {
  const { title, artist, artistId, coverUrl, releaseYear } = req.body;

  const album = await Album.findById(req.params.id);

  if (album) {
    album.title = title || album.title;
    album.artist = artist || album.artist;
    album.artistId = artistId || album.artistId;
    album.coverUrl = coverUrl || album.coverUrl;
    album.releaseYear = releaseYear || album.releaseYear;

    const updatedAlbum = await album.save();
    res.json(updatedAlbum);
  } else {
    res.status(404).json({ message: 'Album not found' });
  }
};

// @desc    Get album by title
// @route   GET /api/albums/title/:title
// @access  Public
const getAlbumByTitle = async (req, res) => {
  const album = await Album.findOne({ title: req.params.title });

  if (album) {
    res.json(album);
  } else {
    res.status(404).json({ message: 'Album not found' });
  }
};

export { getAlbums, createAlbum, deleteAlbum, updateAlbum, getAlbumByTitle };
