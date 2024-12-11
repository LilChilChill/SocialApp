
const Post = require('./feedModel');

const createPost = async (req, res) => {
    try {
        const { author, title, files, status } = req.body;

        if (!author || !title) {
            return res.status(400).json({ message: 'Author và Title là bắt buộc.' });
        }

        const newPost = new Post({ author, title, files, status });
        await newPost.save();
        res.status(201).json({ message: 'Đăng bài viết thành công.', post: newPost });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ.', error: error.message });
    }
};

const getPosts = async (req, res) => {
    try {
        const posts = await Post.find().populate('author', 'name avatar').populate('comments.user', 'name');
        res.status(200).json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ.', error: error.message });
    }
};

const addComment = async (req, res) => {
    try {
        const { postId } = req.params;
        const { user, text } = req.body;

        if (!user || !text) {
            return res.status(400).json({ message: 'User và Text là bắt buộc.' });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Không tìm thấy bài viết.' });
        }

        post.comments.push({ user, text });
        await post.save();

        res.status(201).json({ message: 'Thêm bình luận thành công.', post });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ.', error: error.message });
    }
};

const likePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { userId } = req.body;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Không tìm thấy bài viết.' });
        }

        if (post.likes.includes(userId)) {
            return res.status(400).json({ message: 'Người dùng đã thích bài viết này.' });
        }

        post.likes.push(userId);
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
}