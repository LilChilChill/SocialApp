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
                'X-Priority': '1', // 1: Cao nhất, 5: Thấp nhất
                'X-MSMail-Priority': 'High',
                'Importance': 'high'
            },
            html: `
                <p><strong style="color:red;">Lưu ý: Đây là email quan trọng!</strong></p>
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

module.exports = { sendResetPasswordEmail };
