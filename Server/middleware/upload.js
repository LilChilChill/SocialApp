const { Storage } = require('@google-cloud/storage');
const multer = require('multer');
const path = require('path');

const storage = new Storage({ keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS });
const bucket = storage.bucket(process.env.GOOGLE_CLOUD_BUCKET);

// Cấu hình Multer để xử lý file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
});

// Hàm upload file lên GCS
const uploadToGCS = (file, folder = 'uploads') => {
  return new Promise((resolve, reject) => {
    if (!file) return reject('No file provided');

    const blob = bucket.file(`${folder}/${Date.now()}-${file.originalname}`);
    const blobStream = blob.createWriteStream({
      metadata: { contentType: file.mimetype },
    });

    blobStream.on('error', (err) => reject(err));

    blobStream.on('finish', async () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
      resolve(publicUrl);
    });

    blobStream.end(file.buffer);
  });
};

module.exports = { upload, uploadToGCS };
