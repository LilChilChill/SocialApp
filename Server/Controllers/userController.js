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
    const { name, birthDate, gender, phoneNumber } = req.body;

    try {
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const updateFields = {};
        if (name && name.length >= 3) updateFields.name = name;
        if (birthDate) updateFields.birthDate = birthDate;
        if (gender) updateFields.gender = gender;
        if (phoneNumber) {
            if (!validator.isMobilePhone(phoneNumber, 'vi-VN')) {
                return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });
            }
            updateFields.phoneNumber = phoneNumber;
        }

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

const changePassword = async (req, res) => {
    try {
        const userId = req.user._id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });
        }

        if (!validator.isStrongPassword(newPassword)) {
            return res.status(400).json({
                message: 'Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt'
            });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Mật khẩu hiện tại không đúng' });
        }

        // Kiểm tra nếu mật khẩu mới trùng với mật khẩu cũ
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({ message: 'Mật khẩu mới không được trùng với mật khẩu cũ' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedNewPassword;
        await user.save();

        res.status(200).json({ message: 'Mật khẩu đã được cập nhật thành công' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

const crypto = require('crypto');
const { sendResetPasswordEmail } = require('../services/emailService');

const link = process.env.API  
console.log(link)
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'Email không tồn tại' });
        }

        // Tạo token ngẫu nhiên
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 phút

        await user.save();

        // Gửi email
        const resetLink = `${link}/components/resetPassword.html?token=${resetToken}`;
        await sendResetPasswordEmail(email, resetLink);

        res.status(200).json({ message: 'Vui lòng kiểm tra email để đặt lại mật khẩu' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        const user = await userModel.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
        }

        if (!validator.isStrongPassword(newPassword)) {
            return res.status(400).json({
                message: 'Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt'
            });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;

        await user.save();
        res.status(200).json({ message: 'Mật khẩu đã được cập nhật' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
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

const removeAccents = require('remove-accents');

const searchUsers = async (req, res) => {
    const { query } = req.query;
    try {
        if (!query) {
            return res.status(400).json({ message: 'Query không được để trống' });
        }

        const users = await userModel.find().select('-password -friends'); // Lấy toàn bộ user
        
        const normalizedQuery = removeAccents(query.toLowerCase());

        const filteredUsers = users.filter(user => {
            const normalizedName = removeAccents(user.name.toLowerCase());
            return normalizedName.includes(normalizedQuery);
        });

        res.status(200).json(filteredUsers);
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
    removeFriend,
    changePassword,
    forgotPassword,
    resetPassword
}
