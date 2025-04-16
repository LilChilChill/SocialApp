const FriendRequest = require('../Models/friendModel') // Model cho lời mời kết bạn
const User = require('../Models/userModel') // Model cho người dùng

// Gửi lời mời kết bạn
const sendFriendRequest = async (req, res) => {
    const { receiverId } = req.body
    const senderId = req.user._id

    try {
        const existingRequest = await FriendRequest.findOne({ sender: senderId, receiver: receiverId })
        if (existingRequest)
            return res.status(400).json({ message: 'Friend request already sent' })

        const sender = await User.findById(senderId)
        if (sender.friends.includes(receiverId))
            return res.status(400).json({ message: 'You are already friends with this user' })

        const newFriendRequest = new FriendRequest({
            sender: senderId,
            receiver: receiverId
        })

        await newFriendRequest.save()
        res.status(200).json({ message: 'Friend request sent successfully' })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Server error' })
    }
}

// Chấp nhận lời mời kết bạn
const acceptFriendRequest = async (req, res) => {
    const { id } = req.params
    const userId = req.user._id

    try {
        const existingFriendRequest = await FriendRequest.findOne({ _id: id, receiver: userId, status: 'pending' })

        if (!existingFriendRequest)
            return res.status(404).json({ message: 'Friend request not found' })

        existingFriendRequest.status = 'accepted'

        const sender = await User.findById(existingFriendRequest.sender)
        const receiver = await User.findById(existingFriendRequest.receiver)

        if (!sender || !receiver)
            return res.status(404).json({ message: 'User not found' })

        if (!sender.friends.includes(receiver._id)) {
            sender.friends.push(receiver._id)
            await sender.save()
        }

        if (!receiver.friends.includes(sender._id)) {
            receiver.friends.push(sender._id)
            await receiver.save()
        }

        await FriendRequest.findByIdAndDelete(existingFriendRequest._id)
        res.status(200).json({ message: 'Friend request accepted successfully' })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Server error' })
    }
}

// Từ chối lời mời kết bạn
const declineFriendRequest = async (req, res) => {
    const { id } = req.params
    const userId = req.user._id

    try {
        const existingFriendRequest = await FriendRequest.findOne({ _id: id, receiver: userId, status: 'pending' })

        if (!existingFriendRequest)
            return res.status(404).json({ message: 'Friend request not found' })

        await FriendRequest.findByIdAndDelete(existingFriendRequest._id)
        res.status(200).json({ message: 'Friend request declined successfully' })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Server error' })
    }
}

// Lấy danh sách lời mời kết bạn
const getFriendRequests = async (req, res) => {
    const userId = req.user._id

    try {
        const friendRequests = await FriendRequest.find({ receiver: userId, status: 'pending' }).populate('sender', 'name avatar')
        res.status(200).json(friendRequests)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Server error' })
    }
}

module.exports = {
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    getFriendRequests
}
