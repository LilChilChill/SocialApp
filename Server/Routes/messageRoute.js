const express = require('express');
const { sendMessage, getMessages, getChatImages, deleteChatHistory } = require('../Controllers/messageController');
const { authMiddleware } = require('../middleware/authMiddleware');
const multer = require('multer');

const storage = multer.memoryStorage();

const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'text/plain', // .txt
    'video/mp4',
    'video/quicktime', // .mov
    'video/x-msvideo' // .avi
];

// const fileFilter = (req, file, cb) => {
//     if (!allowedTypes.includes(file.mimetype)) {
//         return cb(new Error('Loại file không được chấp nhận'), false);
//     }
//     cb(null, true);
// };

const fileFilter = (req, file, cb) => {
    cb(null, true);
};


const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 25 * 1024 * 1024 } 
});

const router = express.Router();

const messageRoute = (io) => {
    router.post('/', authMiddleware, upload.single('file'), (req, res) => sendMessage(io)(req, res));
    router.get('/:friendId', authMiddleware, getMessages);
    router.get('/images/:friendId', authMiddleware, getChatImages);
    router.delete('/delete/:friendId', authMiddleware, deleteChatHistory);
    return router;
};

module.exports = messageRoute;