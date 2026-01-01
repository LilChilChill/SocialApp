const { Storage } = require('@google-cloud/storage');
const path = require('path');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

let storage;

if (process.env.GOOGLE_SERVICE_ACCOUNT) {
  storage = new Storage({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT)
  });
} else {
  storage = new Storage({
    keyFilename: path.join(__dirname, '../service-account.json')
  });
}


const bucketName = process.env.GOOGLE_CLOUD_BUCKET;
const bucket = storage.bucket(bucketName);

const uploadImageToGCS = async (file, folder = 'uploads') => {
  if (!file || !file.buffer) {
    throw new Error('No file provided or file buffer is missing');
  }

  const uniqueFileName = `${uuidv4()}-${file.originalname}`;
  const filePath = `${folder}/${uniqueFileName}`;
  const blob = bucket.file(filePath);

  try {
    let bufferToUpload;
    let contentType = file.mimetype;

    if (file.mimetype.startsWith('image/')) {
      const originalSizeMB = file.buffer.length / 1024 / 1024;
      if (originalSizeMB > 25) {
        bufferToUpload = await sharp(file.buffer)
          .resize({ width: 1920, height: 1080, fit: 'inside' })
          .jpeg({ quality: 80 })
          .toBuffer();
        contentType = 'image/jpeg';
      } else {
        bufferToUpload = file.buffer;
      }
    } else {
      bufferToUpload = file.buffer;
    }

    await blob.save(bufferToUpload, { metadata: { contentType } });
    await blob.makePublic();

    return {
      url: `https://storage.googleapis.com/${bucketName}/${filePath}`,
      originalName: file.originalname,
      mimeType: contentType
    };
  } catch (err) {
    throw new Error('Lỗi khi xử lý hoặc tải file lên GCS: ' + err.message);
  }
};

const deleteFileFromGCS = async (fileUrl) => {
  try {
    const filePath = fileUrl.replace(`https://storage.googleapis.com/${bucketName}/`, '');
    await bucket.file(filePath).delete();
    console.log(`Đã xóa file: ${filePath}`);
  } catch (error) {
    console.error(`Lỗi khi xóa file từ GCS: ${error.message}`);
  }
};

const updateAvatar = async (fileUrl) => {
  if (!fileUrl) return;

  try {
    const filePath = fileUrl.replace(`https://storage.googleapis.com/${bucketName}/`, '');
    await bucket.file(filePath).delete();
    console.log(`Đã xóa file: ${filePath}`);
  } catch (error) {
    console.error(`Lỗi khi xóa file từ GCS: ${error.message}`);
  }
};

module.exports = { uploadImageToGCS, deleteFileFromGCS, updateAvatar };
