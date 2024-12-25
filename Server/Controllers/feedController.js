// feedController.js
const Post = require('../Models/feedModel');

const createPost = async (req, res) => {
    try {
        const user = req.user; // Lấy thông tin người dùng từ middleware xác thực
        const { title, files, status } = req.body;

        if (!user || !title) {
            return res.status(400).json({ message: 'Author và Title là bắt buộc.' });
        }

        const newPost = new Post({
            author: user._id, // Lưu ObjectId
            title,
            files,
            status,
        });
        await newPost.save();
        res.status(201).json({ message: 'Đăng bài viết thành công.', post: newPost });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ.', error: error.message });
    }
};

const getPosts = async (req, res) => {
    try {
        const posts = await Post.find()
            .populate('author', 'username avatar') // Hiển thị thông tin tác giả
            .populate('comments.user', 'username avatar') // Hiển thị thông tin bình luận
            .exec();

        res.status(200).json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ.', error: error.message });
    }
};

const addComment = async (req, res) => {
    try {
        const user = req.user; // Lấy thông tin người dùng từ middleware xác thực
        const { postId } = req.params;
        const { text } = req.body;

        if (!user || !text) {
            return res.status(400).json({ message: 'User và Text là bắt buộc.' });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Không tìm thấy bài viết.' });
        }

        post.comments.push({ user: user._id, text }); // Gắn ObjectId vào bình luận
        await post.save();

        res.status(201).json({ message: 'Thêm bình luận thành công.', post });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ.', error: error.message });
    }
};

const likePost = async (req, res) => {
    try {
        const user = req.user; // Lấy thông tin người dùng từ middleware xác thực
        const { postId } = req.params;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Không tìm thấy bài viết.' });
        }

        if (post.likes.includes(user._id)) {
            return res.status(400).json({ message: 'Người dùng đã thích bài viết này.' });
        }

        post.likes.push(user._id); // Lưu ObjectId thay vì username
        await post.save();

        res.status(200).json({ message: 'Thích bài viết thành công.', post });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ.', error: error.message });
    }
};

module.exports = {
    createPost,
    getPosts,
    addComment,
    likePost,
};