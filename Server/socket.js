module.exports = (io) => {
    const users = {}; 
    const groups = {};

    io.on('connection', (socket) => {
        console.log('Người dùng kết nối: ' + socket.id);

        socket.on('register', (userId) => {
            users[userId] = socket.id;
            console.log(`User ${userId} đã đăng ký với socket ID: ${socket.id}`);
        });

        socket.on('joinGroup', ({ userId, groupId }) => {
            users[userId] = socket.id;
            socket.join(groupId);
            if (!groups[groupId]) {
                groups[groupId] = [];
            }
            if (!groups[groupId].includes(userId)) {
                groups[groupId].push(userId);
            }
            console.log(`User ${userId} đã tham gia group ${groupId}`);
        });

        socket.on('leaveGroup', ({ userId, groupId }) => {
            socket.leave(groupId);
            if (groups[groupId]) {
                groups[groupId] = groups[groupId].filter((id) => id !== userId);
                console.log(`User ${userId} đã rời group ${groupId}`);
            }
        });

        socket.on('sendMessage', async (messageData) => {
            const date = new Date();
            let hours = date.getHours();
            let minutes = date.getMinutes();

            hours = hours < 10 ? `0${hours}` : hours;
            minutes = minutes < 10 ? `0${minutes}` : minutes;
            messageData.date = `${hours}:${minutes}`;

            const { chatType, receiverId, groupId, sender, content, fileUrl, fileType } = messageData;

            if (!['group', 'private'].includes(chatType)) {
                console.log(`Loại tin nhắn không hợp lệ: ${chatType}`);
                return;
            }

            if (chatType === 'group') {
                if (!groups[groupId] || !groups[groupId].includes(sender)) {
                    console.log(`User ${sender} không thuộc group ${groupId}`);
                    return;
                }
                console.log(`Gửi tin nhắn đến group ${groupId}`);
                io.to(groupId).emit('receiveMessage', messageData);
            } else if (chatType === 'private') {
                const receiverSocketId = users[receiverId];
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('receiveMessage', messageData);
                    console.log(`Gửi tin nhắn từ ${sender} đến ${receiverId}`);
                } else {
                    console.log(`Người dùng ${receiverId} hiện không online.`);
                }
            }
        });

        socket.on('signal', (data) => {
            socket.broadcast.emit('signal', data);
        });

        socket.on('disconnect', () => {
            console.log('Người dùng mất kết nối: ' + socket.id);
            for (const userId in users) {
                if (users[userId] === socket.id) {
                    delete users[userId];
                    console.log(`User ${userId} đã ngắt kết nối.`);

                    for (const groupId in groups) {
                        groups[groupId] = groups[groupId].filter((id) => id !== userId);
                    }
                    break;
                }
            }
        });
    });
};
