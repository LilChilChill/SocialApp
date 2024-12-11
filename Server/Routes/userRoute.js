const express = require('express')
const {
    register,
    login,
    getUserProfile,
    updateUser,
    getUsers,
    searchUsers,
    getFriends,
    removeFriend
} = require('../Controllers/userController')
const { authMiddleware, createToken} = require('../middleware/authMiddleware')

const multer = require('multer')

const storage = multer.memoryStorage()

const fileFilter = (req, avatar, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png']
    if (!allowedTypes.includes(avatar.mimetype)) {
        cb(new Error('Invalid file type, only JPEG and PNG are allowed.'), false)
    } else {
        cb(null, true)
    }
}

const upload = multer({
    storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 5
    }
})

const router = express.Router()
router.post('/register', register)
router.post('/login', login)
router.get('/profile', authMiddleware, getUserProfile)
router.put('/update', authMiddleware, upload.single('avatar'), updateUser)
router.get('/', authMiddleware, getUsers)
router.get('/search', authMiddleware, searchUsers)
router.get('/friends', authMiddleware, getFriends)
router.get('/friends/:friendId', authMiddleware, removeFriend)

module.exports = router