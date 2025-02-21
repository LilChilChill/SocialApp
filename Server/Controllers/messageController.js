// const Message = require('../Models/messageModel');
// const fs = require('fs');
// const path = require('path');

// const sendMessage = (io) => async (req, res) => {
//     const { receiverId, content } = req.body; 
//     const senderId = req.user._id;
//     let fileData = null;

//     let date = new Date();
//     let hours = date.getHours();
//     let minutes = date.getMinutes();
//     if (hours < 10) hours = `0${hours}`;
//     if (minutes < 10) minutes = `0${minutes}`;
//     date = `${hours}:${minutes}`;

//     if (req.file) {
//         fileData = {
//             data: req.file.buffer,
//             contentType: req.file.mimetype
//         };
//     }

//     try {
//         const messageData = new Message({
//             sender: senderId,
//             receiver: receiverId,
//             content: content || '', 
//             file: fileData,
//             date: date
//         });

//         if (content || fileData) {
//             await messageData.save(); 

//             io.to(receiverId).emit('receiveMessage', {
//                 senderId,
//                 receiverId,
//                 content: messageData.content,
//                 file: messageData.file,
//                 date
//             });

//             res.status(200).json({ message: 'Tin nhắn đã được gửi thành công', messageData });
//         } else {
//             return res.status(400).json({ message: 'Không có nội dung để gửi' });
//         }
//     } catch (error) {
//         console.error('Lỗi:', error);
//         res.status(500).json({ message: 'Có lỗi xảy ra', error: error.message });
//     }
// };


// const getMessages = async (req, res) => {
//     const userId = req.user._id;
//     const friendId = req.params.friendId;
//     const limit = parseInt(req.query.limit) || 15;  
//     const page = parseInt(req.query.page) || 1;
//     const skip = (page - 1) * limit;
    
//     try {
//         const messages = await Message.find({
//             $or: [
//                 { sender: userId, receiver: friendId },
//                 { sender: friendId, receiver: userId }
//             ]
//         })
//         .sort('-timestamp')  
//         .skip(skip)
//         .limit(limit)
//         .select('sender receiver content file date timestamp isRead');

//         const formattedMessages = messages.reverse().map(message => {  
//             if (message.file && message.file.data) {
//                 return {
//                     ...message.toObject(),
//                     file: {
//                         data: message.file.data.toString('base64'), 
//                         contentType: message.file.contentType
//                     },
//                 };
//             }
//             return message;
//         });

//         res.status(200).json(formattedMessages);
//     } catch (error) {
//         res.status(500).json({ message: 'Có lỗi xảy ra khi lấy tin nhắn', error: error.message });
//     }
// };


// const deleteChatHistory = async (req, res) => {
//     try {
//         const { friendId } = req.params;
//         const userId = req.user._id;

//         const result = await Message.deleteMany({
//             $or: [
//                 { sender: userId, receiver: friendId },
//                 { sender: friendId, receiver: userId }
//             ]
//         });

//         if (result.deletedCount === 0) {
//             return res.status(404).json({ message: 'Không có tin nhắn nào để xóa' });
//         }

//         res.status(200).json({ message: 'Lịch sử chat đã được xóa', deletedCount: result.deletedCount });
//     } catch (error) {
//         console.error('Lỗi khi xóa lịch sử chat:', error);
//         res.status(500).json({ message: 'Lỗi khi xóa lịch sử chat', error: error.message });
//     }
// };

// const getChatImages = async (req, res) => {
//     const userId = req.user._id;
//     const friendId = req.params.friendId;
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const skip = (page - 1) * limit;

//     try {
//         const images = await Message.find({
//             $or: [
//                 { sender: userId, receiver: friendId },
//                 { sender: friendId, receiver: userId }
//             ],
//             file: { $ne: null }
//         })
//         .sort('-timestamp')
//         .skip(skip)
//         .limit(limit)
//         .select('file date');

//         const formattedImages = images.map(message => ({
//             file: {
//                 data: message.file.data.toString('base64'),
//                 contentType: message.file.contentType
//             },
//             date: message.date
//         }));

//         res.status(200).json({
//             images: formattedImages,
//             hasMore: formattedImages.length === limit
//         });
//     } catch (error) {
//         res.status(500).json({ message: 'Có lỗi xảy ra khi lấy ảnh', error: error.message });
//     }
// };


// const getSingleChat = async (req, res) => {
//     const chatId = req.sessage._id
//     try {
//         const chat = await Message.find(chatId)
//         res.status(200).json(chat)
//         console.log("Chat Id: " + chatId)
//     } catch(error){
//         console.error(error)
//         res.status(500).json({ message: 'Lỗi khi lấy lịch sử chat:', error: error.message });
//     }
// }

// module.exports = { sendMessage, getMessages, deleteChatHistory, getSingleChat, getChatImages };


const Message = require('../Models/messageModel');
const { uploadImageToGCS, deleteFileFromGCS  } = require('../services/gcsService');

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
        let fileUrl = null;
        let fileType = null;

        if (req.file) {
            fileUrl = await uploadImageToGCS(req.file, 'messages');
            fileType = req.file.mimetype;
        }

        const messageData = new Message({
            sender: senderId,
            receiver: receiverId,
            content: content || '',
            fileUrl,
            fileType,
            date
        });

        await messageData.save();

        io.to(receiverId).emit('receiveMessage', {
            senderId,
            receiverId,
            content: messageData.content,
            fileUrl: messageData.fileUrl,
            fileType: messageData.fileType,
            date
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
        .select('sender receiver content fileUrl fileType date timestamp isRead');

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
            fileUrl: { $ne: null }
        })
        .sort('-timestamp')
        .select('fileUrl fileType date');

        res.status(200).json({ images });
    } catch (error) {
        res.status(500).json({ message: 'Có lỗi xảy ra khi lấy ảnh', error: error.message });
    }
};

const deleteChatHistory = async (req, res) => {
    try {
        const { friendId } = req.params;
        const userId = req.user._id;

        // Tìm tất cả tin nhắn có chứa fileUrl
        const messagesWithFiles = await Message.find({
            $or: [
                { sender: userId, receiver: friendId },
                { sender: friendId, receiver: userId }
            ],
            fileUrl: { $ne: null }
        }).select('fileUrl');

        // Xóa từng file trên GCS
        for (const message of messagesWithFiles) {
            await deleteFileFromGCS(message.fileUrl);
        }

        // Xóa tất cả tin nhắn trong MongoDB
        const result = await Message.deleteMany({
            $or: [
                { sender: userId, receiver: friendId },
                { sender: friendId, receiver: userId }
            ]
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Không có tin nhắn nào để xóa' });
        }

        res.status(200).json({ message: 'Lịch sử chat và tệp đính kèm đã được xóa', deletedCount: result.deletedCount });
    } catch (error) {
        console.error('Lỗi khi xóa lịch sử chat:', error);
        res.status(500).json({ message: 'Lỗi khi xóa lịch sử chat', error: error.message });
    }
};

module.exports = { sendMessage, getMessages, getChatImages, deleteChatHistory };
