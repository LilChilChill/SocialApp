const express = require('express');
const multer = require('multer');
const { createPost, deletePost, getPosts } = require('../Controllers/feedController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/posts', authMiddleware, upload.array('files', 5), createPost);
router.get('/posts', getPosts);
router.delete('/posts/:postId', authMiddleware, deletePost);


module.exports = router;
