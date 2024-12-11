const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
    title: { type: String, required: true },
    files: [
        {
            fileType: {
                type: String,
                enum: ['image', 'video', 'document'],
                required: true
            },
            data: Buffer, 
            contentType: String
        }
    ],
    comments: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            text: { type: String, required: true },
            createdAt: { type: Date, default: Date.now }
        }
    ],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Lượt thích
    shares: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Người đã chia sẻ
    status: {
        type: String,
        enum: ['public', 'private', 'friends'], 
        default: 'public'
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);