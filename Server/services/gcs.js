const { Storage } = require('@google-cloud/storage');
const path = require('path');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

const storage = new Storage({ keyFilename: path.join(__dirname, '../service-account.json') });
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

    if (file.mimetype.startsWith('image/')) {
        fileBuffer = await sharp(file.buffer)
            .resize({ width: 1920, height: 1080, fit: 'inside' })
            .jpeg({ quality: 80 })
            .toBuffer();
    }

    await blob.save(fileBuffer, {
        metadata: { contentType: file.mimetype }
    });

    await blob.makePublic();
    return `https://storage.googleapis.com/${bucketName}/${fileName}`;
};

const deleteFileFromGCS = async (fileUrl) => {
    try {
        if (!fileUrl) return;

        const filePath = fileUrl.split(`https://storage.googleapis.com/${bucketName}/`)[1];
        if (!filePath) return;

        await bucket.file(filePath).delete();
        console.log(`Đã xóa file: ${filePath}`);
    } catch (error) {
        console.error(`Lỗi khi xóa file từ GCS: ${error.message}`);
    }
};

module.exports = { uploadFileToGCS, deleteFileFromGCS };
