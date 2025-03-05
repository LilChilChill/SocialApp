const userModel = require('../Models/userModel')
const bcrypt = require('bcryptjs')
const validator = require('validator')
const { authMiddleware, createToken} = require('../middleware/authMiddleware')
const { options } = require('..')
const { uploadImageToGCS } = require('../services/gcsService');

const register = async (req, res) => {
    try{
        const {name, email, password } = req.body

        let user = await userModel.findOne({email})
        if (user) 
            return res.status(400).json({message: 'Email already exists'})
        if (!name || !email || !password) 
            return res.status(400).json({message: 'All fields are required'})
        if (!validator.isEmail(email)) 
            return res.status(400).json({message: 'Invalid email'})
        if (!validator.isStrongPassword(password))
            return res.status(400).json({message: 'Password should be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character'})
        if (name.length < 3) 
            return res.status(400).json({message: 'Name should be at least 3 characters long'})

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)
        
        user = new userModel({name, email, password: hashedPassword})
        await user.save()

        const token = createToken(user._id)
        res.status(200).json({ _id: user._id, name, email, token})
    } catch(error){
        console.log(error)
        res.status(500).json({message: 'Server error'})
    }
}

const login = async (req, res) => {
    const {email, password } = req.body
    try{
        const user = await userModel.findOne({ email})
        if (!user)
            return res.status(404).json({message: 'User not found'})

        const isValidPassword = await bcrypt.compare(password, user.password)
        if (!isValidPassword)
            return res.status(401).json({message: 'Invalid Password'})
        
        const token = createToken(user._id)
        res.status(200).json({_id: user._id, name: user.name, email, avatar: user.avatar, token})
    } catch(error){
        console.log(error)
        res.status(500).json({message: 'Server error'})
    }
}

const getUserProfile = async (req, res) => {
    try {
        const userId = req.params.userId ? req.params.userId : req.user._id;

        const user = await userModel.findById(userId).select('-password -friends');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server error' });
    }
};


const updateUser = async (req, res) => {
    const userId = req.user._id;
    const { name, birthDate, gender } = req.body;
    // const newAvatar = req.file;

    try {
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const updateFields = {};
        if (name && name.length >= 3) updateFields.name = name;
        if (birthDate) updateFields.birthDate = birthDate;
        if (gender) updateFields.gender = gender;

        if (req.file) {
            const imageUrl = await uploadImageToGCS(req.file, 'avatars');
            updateFields.avatar = imageUrl;
        }

        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            updateFields,
            { new: true, runValidators: true }
        ).select('-password');

        res.status(200).json(updatedUser);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getUsers = async (req, res) => {
    try{
        const users = await userModel.find({}).select('-password')
        res.status(200).json(users)
    } catch(error){
        console.log(error)
        res.status(500).json({message: 'Server error'})
    }
}

const searchUsers = async (req, res) => {
    const { query } = req.query; 
    try {
        const users = await userModel.find({
            $or: [
                { name: { $regex: query, $options: 'i' } }
            ]
        }).select('-password -friends');

        res.status(200).json(users);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getFriends = async (req, res) => {
    const userId = req.user._id
    try {
        const user = await userModel.findById(userId).populate('friends', 'name avatar')

        if (!user)
            return res.status(404).json({ message: 'User not found' })

        res.status(200).json(user.friends)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server error' })
    }
}

const removeFriend = async (req, res) => {
    const friendId = req.params.friendId
    const userId = req.user._id

    try{
        const user = await userModel.findById(userId)

        if (!user)
            return res.status(404).json({ message: 'User not found' })  

        user.friends = user.friends.filter(friend => friend.toString() !== friendId)
        await user.save()

        const friend = await userModel.findById(friendId)

        if (friend) {
            friend.friends = friend.friends.filter(friend => friend.toString()!== userId)
            await friend.save()
        }

        res.status(200).json({message: 'Friend removed successfully'})
    } catch(error){
        console.log(error)
        res.status(500).json({message: 'Server error'})
    }
}

module.exports = {
    register,
    login,
    getUserProfile,
    updateUser,
    getUsers,
    searchUsers,
    getFriends,
    removeFriend
}
