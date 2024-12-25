const express = require('express');
const router = express.Router();
const {
    createPost,
    getPosts,
    addComment,
    likePost,
} = require('../Controllers/feedController');

router.post('/posts', createPost);
router.get('/posts', getPosts);
router.post('/posts/:postId/comments', addComment);
router.post('/posts/:postId/like', likePost);

module.exports = router;