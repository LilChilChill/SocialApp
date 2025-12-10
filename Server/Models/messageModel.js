// const mongoose = require('mongoose');

// const messageSchema = new mongoose.Schema({
//     sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     content: { type: String, required: false },
//     fileUrl: { type: String },
//     fileType: { type: String },
//     fileName : { type: String },
//     isRead: { type: Boolean, default: false },
//     date: { type: String },
//     timestamp: { type: Date, default: Date.now },
// });

// module.exports = mongoose.model('Message', messageSchema);

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: false },

    // ❌ Bỏ fileUrl / fileType / fileName
    // fileUrl: String,
    // fileType: String,
    // fileName: String,

    // ✅ Mảng files
    files: [
        {
            url: String,
            mimeType: String,
            fileName: String
        }
    ],

    isRead: { type: Boolean, default: false },
    date: { type: String },
    timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Message', messageSchema);
