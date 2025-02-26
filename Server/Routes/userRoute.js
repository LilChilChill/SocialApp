const express = require('express');
const {
    register,
    login,
    getUserProfile,
    updateUser,
    getUsers,
    searchUsers,
    getFriends,
    removeFriend
} = require('../Controllers/userController');
const { authMiddleware } = require('../middleware/authMiddleware');

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();
router.post('/register', register);
router.post('/login', login);
router.get('/profile', authMiddleware, getUserProfile);
router.put('/update', authMiddleware, upload.single('avatar'), updateUser);
router.get('/', authMiddleware, getUsers);
router.get('/search', authMiddleware, searchUsers);
router.get('/friends', authMiddleware, getFriends);
router.delete('/friends/:friendId', authMiddleware, removeFriend); // Sửa GET -> DELETE

module.exports = router;
