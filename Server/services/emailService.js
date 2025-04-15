const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS  
    }
});

const sendResetPasswordEmail = async (email, resetLink) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'ĐẶT LẠI MẬT KHẨU',
            headers: {
                'X-Priority': '1',
                'X-MSMail-Priority': 'High',
                'Importance': 'high'
            },
            html: `
                <p>Bạn đã yêu cầu đặt lại mật khẩu.</p>
                <p>Nhấn vào link bên dưới để đặt lại mật khẩu:</p>
                <a href="${resetLink}">${resetLink}</a>
                <p>Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
            `
        };
        
        await transporter.sendMail(mailOptions);
        console.log('Email đặt lại mật khẩu đã được gửi!');
    } catch (error) {
        console.error('Lỗi gửi email:', error);
    }
};

const sendVerificationEmail = async (email, verifyLink) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'XÁC NHẬN ĐĂNG KÝ TÀI KHOẢN',
            headers: {
                'X-Priority': '1',
                'X-MSMail-Priority': 'High',
                'Importance': 'high'
            },
            html: `
                <h3>Chào mừng bạn đến với ứng dụng của chúng tôi!</h3>
                <p>Nhấn vào liên kết bên dưới để xác nhận tài khoản của bạn:</p>
                <a href="${verifyLink}">${verifyLink}</a>
                <p>Nếu bạn không đăng ký, vui lòng bỏ qua email này.</p>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Email xác nhận đăng ký đã được gửi!');
    } catch (error) {
        console.error('Lỗi gửi email xác nhận:', error);
    }
};


module.exports = { sendResetPasswordEmail, sendVerificationEmail };
