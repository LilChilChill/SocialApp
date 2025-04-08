const Post = require('../Models/feedModel');
const { uploadFileToGCS, deleteFileFromGCS } = require('../services/gcs');

const createPost = async (req, res) => {
    try {
        const { title, status } = req.body;
        const user = req.user;

        if (!title) {
            return res.status(400).json({ message: 'Nội dung bài viết không được để trống.' });
        }

        let uploadedFiles = [];
        if (req.files) {
            uploadedFiles = await Promise.all(req.files.map(async (file) => ({
                fileType: file.mimetype.startsWith('image/') ? 'image' : file.mimetype.startsWith('video/') ? 'video' : 'document',
                data: await uploadFileToGCS(file, 'posts'),
                contentType: file.mimetype
            })));
        }

        const newPost = new Post({
            author: user._id,
            title,
            files: uploadedFiles,
            status
        });

        await newPost.save();
        res.status(201).json({ message: 'Đăng bài thành công.', post: newPost });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ.', error: error.message });
    }
};

const getPosts = async (req, res) => {
    try {
        const { page = 1, limit = 25, userId } = req.query;

        let filter = {};
        if (userId) {
            filter.author = userId;
        }

        const posts = await Post.find(filter)
            .populate('author', 'name avatar')
            .populate('comments.user', 'name avatar')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.status(200).json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ.', error: error.message });
    }
};

const updatePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { title, status } = req.body;
        const user = req.user;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Không tìm thấy bài viết.' });

        if (post.author.toString() !== user._id.toString()) {
            return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa bài viết này.' });
        }

        let uploadedFiles = post.files;
        if (req.files) {
            for (const file of post.files) {
                await deleteFileFromGCS(file.data);
            }

            uploadedFiles = await Promise.all(req.files.map(async (file) => ({
                fileType: file.mimetype.startsWith('image/') ? 'image' : file.mimetype.startsWith('video/') ? 'video' : 'document',
                data: await uploadFileToGCS(file, 'posts'),
                contentType: file.mimetype
            })));
        }

        post.title = title || post.title;
        post.status = status || post.status;
        post.files = uploadedFiles;
        post.updatedAt = Date.now();

        await post.save();
        res.status(200).json({ message: 'Cập nhật bài viết thành công.', post });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ.', error: error.message });
    }
};

const likePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const user = req.user;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Không tìm thấy bài viết.' });

        const index = post.likes.indexOf(user._id);
        if (index !== -1) {
            post.likes.splice(index, 1);
        } else {
            post.likes.push(user._id);
        }

        await post.save();
        res.status(200).json({ message: 'Cập nhật lượt thích thành công.', likes: post.likes.length });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ.', error: error.message });
    }
};

const commentPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { text } = req.body;
        const user = req.user;

        if (!text) return res.status(400).json({ message: 'Bình luận không được để trống.' });

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Không tìm thấy bài viết.' });

        post.comments.push({ user: user._id, text });
        await post.save();

        const updatedPost = await Post.findById(postId)
            .populate('comments.user', 'name avatar'); // Lấy thêm tên và avatar

        res.status(201).json({ message: 'Bình luận thành công.', comments: updatedPost.comments });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ.', error: error.message });
    }
};

const deleteComment = async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        const user = req.user;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Không tìm thấy bài viết.' });

        const commentIndex = post.comments.findIndex((c) => c._id.toString() === commentId);
        if (commentIndex === -1) return res.status(404).json({ message: 'Không tìm thấy bình luận.' });

        const comment = post.comments[commentIndex];
        if (comment.user.toString() !== user._id.toString() && post.author.toString() !== user._id.toString()) {
            return res.status(403).json({ message: 'Bạn không có quyền xóa bình luận này.' });
        }

        post.comments.splice(commentIndex, 1);
        await post.save();
        res.status(200).json({ message: 'Xóa bình luận thành công.', comments: post.comments });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ.', error: error.message });
    }
};

const deletePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const user = req.user;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Không tìm thấy bài viết.' });
        }

        if (post.author.toString() !== user._id.toString()) {
            return res.status(403).json({ message: 'Bạn không có quyền xóa bài viết này.' });
        }

        for (const file of post.files) {
            await deleteFileFromGCS(file.data);
        }

        await Post.findByIdAndDelete(postId);
        res.status(200).json({ message: 'Xóa bài viết thành công.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ.', error: error.message });
    }
};

module.exports = { createPost, getPosts, deletePost, updatePost, likePost, commentPost, deleteComment };
