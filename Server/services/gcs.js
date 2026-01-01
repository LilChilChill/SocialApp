const { Storage } = require('@google-cloud/storage');
const path = require('path');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

let storage;

if (process.env.GOOGLE_SERVICE_ACCOUNT) {
  storage = new Storage({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT)
  });
} 
else {
  storage = new Storage({
    keyFilename: path.join(__dirname, '../service-account.json')
  });
}

const bucketName = process.env.GOOGLE_CLOUD_BUCKET;
const bucket = storage.bucket(bucketName);

const uploadFileToGCS = async (file, folder = 'uploads') => {
  if (!file || !file.buffer) {
    throw new Error('No file provided or file buffer is missing');
  }

  const fileExt = path.extname(file.originalname);
  const fileName = `${folder}/${uuidv4()}${fileExt}`;
  const blob = bucket.file(fileName);

  let fileBuffer = file.buffer;
  let contentType = file.mimetype;

  if (file.mimetype.startsWith('image/')) {
    fileBuffer = await sharp(file.buffer)
      .resize({ width: 1920, height: 1080, fit: 'inside' })
      .jpeg({ quality: 80 })
      .toBuffer();
    contentType = 'image/jpeg';
  }

  await blob.save(fileBuffer, {
    metadata: { contentType }
  });

  await blob.makePublic();

  return `https://storage.googleapis.com/${bucketName}/${fileName}`;
};

const deleteFileFromGCS = async (fileUrl) => {
  try {
    if (!fileUrl) return;

    const filePath = fileUrl.replace(
      `https://storage.googleapis.com/${bucketName}/`,
      ''
    );

    await bucket.file(filePath).delete();
    console.log(`Đã xóa file: ${filePath}`);
  } catch (error) {
    console.error(`Lỗi khi xóa file từ GCS: ${error.message}`);
  }
};

module.exports = { uploadFileToGCS, deleteFileFromGCS };
