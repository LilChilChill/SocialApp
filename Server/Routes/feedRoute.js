const express = require('express');
const router = express.Router();
const {} = require('./feedController');

router.post('/posts', feedController.createPost);
router.get('/posts', feedController.getPosts);
router.post('/posts/:postId/comments', feedController.addComment);
router.post('/posts/:postId/like', feedController.likePost);

module.exports = router;