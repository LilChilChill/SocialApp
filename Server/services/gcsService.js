// const { Storage } = require('@google-cloud/storage');
// const path = require('path');
// const sharp = require('sharp'); // Thư viện nén ảnh
// const { v4: uuidv4 } = require('uuid');

// const storage = new Storage({ keyFilename: path.join(__dirname, '../service-account.json') });
// const bucketName = process.env.GOOGLE_CLOUD_BUCKET;
// const bucket = storage.bucket(bucketName);

// const uploadImageToGCS = async (file, folder = 'uploads') => {
//     if (!file || !file.buffer) {
//         throw new Error('No file provided or file buffer is missing');
//     }

//     const fileName = `${folder}/${uuidv4()}-${file.originalname}`;
//     const blob = bucket.file(fileName);

//     try {
//         let bufferToUpload;
//         let contentType = file.mimetype;

//         // Nếu là ảnh thì nén
//         if (file.mimetype.startsWith('image/')) {
//             const originalSizeMB = file.buffer.length / 1024 / 1024;
//             if (originalSizeMB > 25) {
//                 bufferToUpload = await sharp(file.buffer)
//                     .resize({ width: 1920, height: 1080, fit: 'inside' })
//                     .jpeg({ quality: 80 })
//                     .toBuffer();
//                 contentType = 'image/jpeg'; // chuyển sang jpeg sau khi nén
//             } else {
//                 bufferToUpload = file.buffer;
//             }
//         } else {
//             // Nếu không phải ảnh, giữ nguyên
//             bufferToUpload = file.buffer;
//         }

//         await blob.save(bufferToUpload, {
//             metadata: { contentType: contentType }
//         });

//         await blob.makePublic();
//         const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
//         return publicUrl;
//     } catch (err) {
//         throw new Error('Lỗi khi xử lý hoặc tải file lên GCS: ' + err.message);
//     }
// };

// const deleteFileFromGCS = async (fileUrl) => {
//     try {
//         const fileName = fileUrl.split('/').pop(); // Lấy tên file từ URL
//         await storage.bucket(bucketName).file(`messages/${fileName}`).delete();
//         console.log(`Đã xóa file: ${fileName}`);
//     } catch (error) {
//         console.error(`Lỗi khi xóa file từ GCS: ${error.message}`);
//     }
// };


// const updateAvatar = async (fileUrl) => {
//     if (!fileUrl) return; // Nếu không có ảnh cũ thì không cần xóa

//     try {
//         const filePath = fileUrl.replace(`https://storage.googleapis.com/${bucketName}/`, '');
//         await bucket.file(filePath).delete();
//         console.log(`Đã xóa file: ${filePath}`);
//     } catch (error) {
//         console.error(`Lỗi khi xóa file từ GCS: ${error.message}`);
//     }
// };

// module.exports = { uploadImageToGCS, deleteFileFromGCS, updateAvatar };

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

    const uniqueFileName = `${uuidv4()}-${file.originalname}`;
    const filePath = `${folder}/${uniqueFileName}`;
    const blob = bucket.file(filePath);

    try {
        let bufferToUpload;
        let contentType = file.mimetype;

        // Nếu là ảnh thì nén nếu dung lượng > 25MB
        if (file.mimetype.startsWith('image/')) {
            const originalSizeMB = file.buffer.length / 1024 / 1024;
            if (originalSizeMB > 25) {
                bufferToUpload = await sharp(file.buffer)
                    .resize({ width: 1920, height: 1080, fit: 'inside' })
                    .jpeg({ quality: 80 })
                    .toBuffer();
                contentType = 'image/jpeg'; // chuyển sang jpeg sau khi nén
            } else {
                bufferToUpload = file.buffer;
            }
        } else {
            // Không phải ảnh, giữ nguyên
            bufferToUpload = file.buffer;
        }

        await blob.save(bufferToUpload, {
            metadata: { contentType: contentType }
        });

        await blob.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`;

        // Trả cả URL + tên file gốc
        return {
            url: publicUrl,
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
        await storage.bucket(bucketName).file(filePath).delete();
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
