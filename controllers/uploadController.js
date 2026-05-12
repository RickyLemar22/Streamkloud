const uploadFile = async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  const folder = req.uploadFolder || req.body.folder || 'general';

  const fileUrl = `/uploads/${folder}/${req.file.filename}`;

  res.status(201).json({
    message: 'File uploaded successfully using local storage',

    url: fileUrl,
    fileUrl: fileUrl,

    file: {
      originalName: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: fileUrl,
    },
  });
};

export { uploadFile };