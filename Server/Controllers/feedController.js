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

module.exports = { createPost, deletePost };
