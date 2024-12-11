const friendRequest = require('../Models/friendModel')
const User = require('../Models/userModel')

const sendFriendRequest = async (req, res) => {
    const { receiverId } = req.body
    const senderId = req.user._id

    try{
        const existingRequest = await friendRequest.findOne({ senderId: senderId, receiverId: receiverId})
        if (existingRequest)
            return res.status(400).json({ message: 'Friend request already sent' })

        const sender = await User.findById(senderId)
        if (sender.friends.includes(receiverId))
            return res.status(400).json({ message: 'You are already friends with this user' })

        const friendRequest = new friendRequest({
            sender: senderId,
            receiver: receiverId
        })

        await friendRequest.save()
        res.status(200).json({ message: 'Friend request sent successfully'})
    } catch(error) {
        console.error(error)
        res.status(500).json({ message: 'Server error' })
    }
}

const acceptFriendRequest = async (req, res) => {
    const { id } = req.params
    const userId = req.user._id

    try{
        const friendRequest = await friendRequest.findOne({ _id: id, receiver: userId, status: 'pending' })

        if(!friendRequest)
            return res.status(404).json({ message: 'Friend request not found' })

        friendRequest.status = 'accepted'

        const sender = await User.findById(friendRequest.sender)
        const receiver = await User.findById(friendRequest.receiver)

        if (!sender || !receiver)
            return res.status(404).json({ message: 'User not found'})

        if (!sender.friends.includes(receiver._id)) {
            sender.friends.push(receiver._id)
            await sender.save()
        }

        if (!receiver.friends.includes(sender._id)){
            receiver.friends.push(sender._id)
            await receiver.save()
        }

        await friendRequest.findByIdAndDelete(friendRequest._id)
        res.status(200).json({ message: 'Friend request accepted successfully'})
    } catch(error) {
        console.error(error)
        res.status(500).json({ message: 'Server error' })
    }
}

const declineFriendRequest = async (req, res) => {
    const { id } = req.params
    const userId = req.user._id

    try{
        const friendRequest = await friendRequest.findOne({ _id: id, receiver: userId, status: 'pending' })

        if (!friendRequest)
            return res.status(404).json({ message: 'Friend request not found' })

        await friendRequest.findByIdAndDelete(friendRequest._id)
        res.status(200).json({ message: 'Friend request declined successfully'})
    } catch(error) {
        console.error(error)
        res.status(500).json({ message: 'Server error' })
    }
}

const getFriendRequests = async (req, res) => {
    const userId = req.user._id

    try{
        const friendRequests = await friendRequest.find({receiver: userId, status: 'pending'}).populate('sender', 'name')
        res.status(200).json(friendRequests)
    } catch(error){
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