// require('dotenv').config(); // Load biến môi trường đầu tiên

// const express = require('express');
// const cors = require('cors');
// const mongoose = require('mongoose');
// const http = require('http');
// const { Server } = require('socket.io');
// const userRoute = require('./Routes/userRoute');
// const friendsRoute = require('./Routes/friendRoute');
// const feedRoute = require('./Routes/feedRoute');
// const messageRoute = require('./Routes/messageRoute');
// const socketHandler = require('./socket.js');

// const app = express();
// module.exports = app;

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Routes
// app.use("/api/users", userRoute);
// app.use("/api/friends", friendsRoute);
// app.use("/api/feeds", feedRoute);

// // Kiểm tra API hoạt động
// app.get("/", (req, res) => {
//     res.send("Hello, World!");
// });

// const server = http.createServer(app);

// const io = new Server(server, {
//     cors: {
//         origin: '*',
//         methods: ['GET', 'POST']
//     }
// });

// const port = process.env.PORT || 5001;
// const uri = process.env.ATLAS_URI;

// if (uri) {
//     mongoose.connect(uri)
//         .then(() => console.log('MongoDB connected successfully'))
//         .catch((error) => console.error("MongoDB connection error:", error.message));
// } else {
//     console.warn("Warning: ATLAS_URI is not set. Database connection skipped.");
// }

// app.use("/api/messages", messageRoute(io));
// socketHandler(io);

// server.listen(port, () => {
//     console.log(`Server running on port ${port}`);
// });

// const link = process.env.API  
// console.log(link)


require('dotenv').config(); // Load biến môi trường đầu tiên

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

const allowedOrigins = ["https://chixap.netlify.app", "http://localhost:5173"];

// Middleware CORS
app.use(cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Routes
app.use("/api/users", userRoute);
app.use("/api/friends", friendsRoute);
app.use("/api/feeds", feedRoute);

// Kiểm tra API hoạt động
app.get("/", (req, res) => {
    res.send("Hello, World!");
});

// Xử lý preflight request OPTIONS (nếu cần)
app.options("*", (req, res) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header("Access-Control-Allow-Origin", origin);
        res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
        res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }
    res.sendStatus(200);
});

const server = http.createServer(app);

// Cấu hình CORS cho Socket.IO
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"]
    }
});

const port = process.env.PORT || 5001;
const uri = process.env.ATLAS_URI;

if (uri) {
    mongoose.connect(uri)
        .then(() => console.log('MongoDB connected successfully'))
        .catch((error) => console.error("MongoDB connection error:", error.message));
} else {
    console.warn("Warning: ATLAS_URI is not set. Database connection skipped.");
}

// Truyền Socket.IO vào route tin nhắn
app.use("/api/messages", messageRoute(io));

// Khởi chạy socket handler
socketHandler(io);

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// In ra API từ biến môi trường
const link = process.env.API;
console.log("API URL:", link);
