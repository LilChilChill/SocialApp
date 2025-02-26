const express = require('express');
const multer = require('multer');
const { 
    createPost, 
    deletePost, 
    getPosts, 
    updatePost, 
    likePost, 
    commentPost, 
    deleteComment 
} = require('../Controllers/feedController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/posts', authMiddleware, upload.array('files', 5), createPost);
router.get('/posts', getPosts);
router.put('/posts/:postId', authMiddleware, upload.array('files', 5), updatePost);
router.delete('/posts/:postId', authMiddleware, deletePost);
router.post('/posts/:postId/like', authMiddleware, likePost);
router.post('/posts/:postId/comment', authMiddleware, commentPost);
router.delete('/posts/:postId/comment/:commentId', authMiddleware, deleteComment);

module.exports = router;
