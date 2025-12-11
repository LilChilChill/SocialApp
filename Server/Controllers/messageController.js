const Message = require('../Models/messageModel');
const { uploadImageToGCS, deleteFileFromGCS } = require('../services/gcsService');

const sendMessage = (io) => async (req, res) => {
    const { receiverId, content } = req.body;
    const senderId = req.user._id;

    let date = new Date();
    let hours = date.getHours();
    let minutes = date.getMinutes();
    if (hours < 10) hours = `0${hours}`;
    if (minutes < 10) minutes = `0${minutes}`;
    date = `${hours}:${minutes}`;

    try {
        let files = [];

        // Nếu gửi 1 hoặc nhiều file
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const uploaded = await uploadImageToGCS(file, 'messages');

                files.push({
                    url: uploaded.url,
                    mimeType: uploaded.mimeType,
                    fileName: uploaded.originalName
                });
            }
        }

        const messageData = new Message({
            sender: senderId,
            receiver: receiverId,
            content: content || '',
            files,
            date
        });

        await messageData.save();

        io.to(receiverId).emit("receiveMessage", {
            sender: senderId,
            receiver: receiverId,
            content: messageData.content,
            date,
            files: messageData.files.map(f => ({
                fileUrl: f.url,
                fileType: f.mimeType,
                fileName: f.fileName
            }))
        });        

        res.status(200).json({ message: 'Tin nhắn đã được gửi thành công', messageData });
    } catch (error) {
        console.error('Lỗi:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra', error: error.message });
    }
};

const getMessages = async (req, res) => {
    const userId = req.user._id;
    const friendId = req.params.friendId;
    const limit = parseInt(req.query.limit) || 15;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    try {
        const messages = await Message.find({
            $or: [
                { sender: userId, receiver: friendId },
                { sender: friendId, receiver: userId }
            ]
        })
            .sort('-timestamp')
            .skip(skip)
            .limit(limit)
            .select('sender receiver content files date timestamp isRead');

        res.status(200).json(messages.reverse());
    } catch (error) {
        res.status(500).json({ message: 'Có lỗi xảy ra khi lấy tin nhắn', error: error.message });
    }
};


const getChatImages = async (req, res) => {
    const userId = req.user._id;
    const friendId = req.params.friendId;

    try {
        const images = await Message.find({
            $or: [
                { sender: userId, receiver: friendId },
                { sender: friendId, receiver: userId }
            ],
            "files.mimeType": { $regex: /^image\// }
        })
        .sort('-timestamp')
        .select('files date');

        res.status(200).json({ images });
    } catch (error) {
        res.status(500).json({ message: 'Có lỗi xảy ra khi lấy ảnh', error: error.message });
    }
};


const deleteChatHistory = async (req, res) => {
    try {
        const { friendId } = req.params;
        const userId = req.user._id;

        const messages = await Message.find({
            $or: [
                { sender: userId, receiver: friendId },
                { sender: friendId, receiver: userId }
            ]
        });

        // Xóa tất cả file trong các message
        for (const msg of messages) {
            for (const f of msg.files) {
                await deleteFileFromGCS(f.url);
            }
        }

        const result = await Message.deleteMany({
            $or: [
                { sender: userId, receiver: friendId },
                { sender: friendId, receiver: userId }
            ]
        });

        res.status(200).json({ 
            message: 'Đã xóa lịch sử chat và file',
            deletedCount: result.deletedCount 
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi xóa lịch sử chat', error: error.message });
    }
};


module.exports = { sendMessage, getMessages, getChatImages, deleteChatHistory };
