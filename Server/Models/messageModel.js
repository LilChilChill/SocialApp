const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    file: { data: Buffer, contentType: String },
    isRead: { type: Boolean, default: false },
    date: {type: String},
    timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Message', messageSchema);
