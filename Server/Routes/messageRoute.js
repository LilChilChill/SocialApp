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
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
    'application/vnd.ms-excel', 
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
    'text/plain', 
    'video/mp4',
    'video/quicktime', 
    'video/x-msvideo' 
];

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
    router.post('/', authMiddleware, upload.array('file'), (req, res) => sendMessage(io)(req, res));
    router.get('/:friendId', authMiddleware, getMessages);
    router.get('/images/:friendId', authMiddleware, getChatImages);
    router.delete('/delete/:friendId', authMiddleware, deleteChatHistory);
    return router;
};

module.exports = messageRoute;