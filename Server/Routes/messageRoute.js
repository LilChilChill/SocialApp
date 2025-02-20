const express = require('express');
const { 
    sendMessage, 
    getMessages, 
    deleteChatHistory, 
    getChatImages,
    getImageById,
    getSingleChat } = require('../Controllers/messageController');
const { authMiddleware } = require('../middleware/authMiddleware');
const multer = require('multer');

const storage = multer.memoryStorage(); 

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    
    if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error('Loại file không được chấp nhận'), false);
    }
    cb(null, true);
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } 
});

const router = express.Router();


const messageRoute = (io) => {
    router.post('/', authMiddleware, upload.single('file'), (req, res) => sendMessage(io)(req, res)); 
    router.get('/:friendId', authMiddleware, getMessages); 
    router.delete('/delete/:friendId', authMiddleware, deleteChatHistory); 
    // router.get('/:friendId/images', authMiddleware, getChatImages); 
    router.get('/images/:friendId', authMiddleware, getChatImages);
    router.get('/getChat/:id', authMiddleware, getSingleChat);
    return router; 
};

module.exports = messageRoute;
