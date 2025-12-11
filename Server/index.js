require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');

const userRoute = require('./Routes/userRoute');
const friendsRoute = require('./Routes/friendRoute');
const feedRoute = require('./Routes/feedRoute');
const messageRoute = require('./Routes/messageRoute');
const socketHandler = require('./socket.js');

const app = express();
module.exports = app;

// Các domain FE được phép gọi API
const allowedOrigins = [
    "https://chi404.id.vn",
    "https://www.chi404.id.vn",
    "https://chixap.netlify.app",
    "http://chi404.id.vn",
    "http://www.chi404.id.vn",
    "http://localhost:5173"
];

// ⭐ CORS CHUẨN KHÔNG LỖI
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) {
            // Cho phép request từ Postman, mobile app
            return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS: " + origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// API routes
app.use("/api/users", userRoute);
app.use("/api/friends", friendsRoute);
app.use("/api/feeds", feedRoute);

// Test server
app.get("/", (req, res) => {
    res.send("Hello, World!");
});

// ⚠️ XOÁ HOÀN TOÀN phần app.options("*") vì gây lỗi CORS
// Không cần nữa — cors middleware đã xử lý hoàn chỉnh

const server = http.createServer(app);

// ⭐ SOCKET.IO CORS CHUẨN KHÔNG LỖI
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true,
        methods: ["GET", "POST"]
    }
});

// MongoDB connect
const port = process.env.PORT || 5001;
const uri = process.env.ATLAS_URI;

if (uri) {
    mongoose.connect(uri)
        .then(() => console.log("MongoDB connected successfully"))
        .catch(err => console.error("MongoDB connection error:", err.message));
} else {
    console.warn("Warning: ATLAS_URI is not set");
}

// Message routes cần Socket.IO
app.use("/api/messages", messageRoute(io));

// Khởi chạy socket
socketHandler(io);

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

console.log("API URL:", process.env.API);
