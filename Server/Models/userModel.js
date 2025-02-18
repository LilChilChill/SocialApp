const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true},
    password : { type: String, required: true},
    birthDate: { type: String, default: null},
    gender: {
        type: String,
        enum: ['Nam', 'Nữ', 'Khác', 'Male', 'Female', 'Other'],
        default: null
    },
    avatar: { data: Buffer, contentType: String },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isOnline: { type: Boolean, default: false},
    lastActive: { type: Date, default: Date.now },
}, {timeeStamps: true});

module.exports = mongoose.model('User', userSchema);