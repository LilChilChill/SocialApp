// const { Storage } = require('@google-cloud/storage');
// const path = require('path');
// const { v4: uuidv4 } = require('uuid');

// const storage = new Storage({ keyFilename: path.join(__dirname, '../service-account.json') });
// const bucketName = process.env.GOOGLE_CLOUD_BUCKET;
// const bucket = storage.bucket(bucketName);

// const uploadImageToGCS = async (file, folder = 'uploads') => {
//     return new Promise((resolve, reject) => {
//         if (!file || !file.buffer) {
//             return reject(new Error('No file provided or file buffer is missing'));
//         }

//         const fileName = `${folder}/${uuidv4()}-${file.originalname}`;
//         const blob = bucket.file(fileName);

//         const blobStream = blob.createWriteStream({
//             metadata: { contentType: file.mimetype }
//         });

//         blobStream.on('error', (err) => reject(err));

//         blobStream.on('finish', async () => {
//             try {
//                 await blob.makePublic(); // Đảm bảo file có thể truy cập công khai
//                 const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
//                 resolve(publicUrl);
//             } catch (err) {
//                 reject(err);
//             }
//         });

//         blobStream.end(file.buffer);
//     });
// };

// module.exports = { uploadImageToGCS };


const { Storage } = require('@google-cloud/storage');
const path = require('path');
const sharp = require('sharp'); // Thư viện nén ảnh
const { v4: uuidv4 } = require('uuid');

const storage = new Storage({ keyFilename: path.join(__dirname, '../service-account.json') });
const bucketName = process.env.GOOGLE_CLOUD_BUCKET;
const bucket = storage.bucket(bucketName);

const uploadImageToGCS = async (file, folder = 'uploads') => {
    if (!file || !file.buffer) {
        throw new Error('No file provided or file buffer is missing');
    }

    const fileName = `${folder}/${uuidv4()}-${file.originalname}`;
    const blob = bucket.file(fileName);

    try {
        // 📌 Nén ảnh với sharp (JPEG chất lượng 80%, max size 1920x1080)
        const compressedBuffer = await sharp(file.buffer)
            .resize({ width: 1920, height: 1080, fit: 'inside' }) // Giữ nguyên tỉ lệ
            .jpeg({ quality: 80 }) // Giảm chất lượng xuống 80%
            .toBuffer();

        // 📌 Upload ảnh đã nén lên GCS
        await blob.save(compressedBuffer, {
            metadata: { contentType: 'image/jpeg' }
        });

        await blob.makePublic(); // Cho phép ảnh truy cập công khai
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
        return publicUrl;
    } catch (err) {
        throw new Error('Lỗi khi nén hoặc tải ảnh lên GCS: ' + err.message);
    }
};

const deleteFileFromGCS = async (fileUrl) => {
    try {
        const fileName = fileUrl.split('/').pop(); // Lấy tên file từ URL
        await storage.bucket(bucketName).file(`messages/${fileName}`).delete();
        console.log(`Đã xóa file: ${fileName}`);
    } catch (error) {
        console.error(`Lỗi khi xóa file từ GCS: ${error.message}`);
    }
};


const updateAvatar = async (fileUrl) => {
    if (!fileUrl) return; // Nếu không có ảnh cũ thì không cần xóa

    try {
        const filePath = fileUrl.replace(`https://storage.googleapis.com/${bucketName}/`, '');
        await bucket.file(filePath).delete();
        console.log(`Đã xóa file: ${filePath}`);
    } catch (error) {
        console.error(`Lỗi khi xóa file từ GCS: ${error.message}`);
    }
};

module.exports = { uploadImageToGCS, deleteFileFromGCS, updateAvatar };
