const uploadFile = async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  const folder = req.uploadFolder || req.body.folder || 'general';

  const fileUrl = req.file.location;
  const fileKey = req.file.key;

  res.status(201).json({
    message: 'File uploaded successfully using S3 storage',

    url: fileUrl,
    fileUrl,
    key: fileKey,

    file: {
      originalName: req.file.originalname,
      filename: fileKey,
      key: fileKey,
      folder,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: fileUrl,
    },
  });
};

export { uploadFile };