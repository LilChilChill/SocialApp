const jwt = require('jsonwebtoken')

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Chưa xác thực' })
    }

    const token = authHeader.split(' ')[1]

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY)
        req.user = { _id: decoded._id }
        next()
    } catch (error) {
        return res.status(401).json({ message: 'Token không hợp lệ' })
    }
}

const createToken = (_id) => {
    const jwtkey = process.env.JWT_SECRET_KEY;
    return jwt.sign({ _id }, jwtkey, { expiresIn: '24h' });
};

module.exports = { authMiddleware, createToken}