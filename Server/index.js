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

app.use(cors({
    origin: function (origin, callback) {
        // Cho phép request không có origin (OPTIONS, mobile, Postman)
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        console.log("⛔ Blocked by CORS:", origin);
        return callback(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// ĐẢM BẢO OPTIONS luôn trả về 200
app.options("*", cors());

app.use(express.json());

// API routes
app.use("/api/users", userRoute);
app.use("/api/friends", friendsRoute);
app.use("/api/feeds", feedRoute);

// Test server
app.get("/", (req, res) => {
    res.send("Hello, World!");
});

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true,
        methods: ["GET", "POST"]
    }
});

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
