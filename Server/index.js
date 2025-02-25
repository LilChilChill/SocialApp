// const express = require('express')
// const cors = require('cors')
// const mongoose = require('mongoose')
// const http = require('http')
// const { Server } = require('socket.io');
// const userRoute = require('./Routes/userRoute')
// const friendsRoute = require('./Routes/friendRoute')
// const feedRoute = require('./Routes/feedRoute')
// const messageRoute = require('./Routes/messageRoute')
// const socketHandler = require('./socket.js')

// const app = express()
// module.exports = app
// require('dotenv').config()

// app.use(express.json())
// app.use(cors())
// app.use("/api/users", userRoute)
// app.use("/api/friends", friendsRoute)
// app.use("/api/feeds", feedRoute)

// app.get("/", (req, res) => {
//     res.send("Hello, World!");
// });

// const server = http.createServer(app)

// const io = new Server(server, {
//     cors: {
//         origin: '*', 
//         methods: ['GET', 'POST']
//     }
// });


// const port = process.env.PORT || 5001;
// const uri = process.env.ATLAS_URI

// app.use("/api/messages", messageRoute(io));

// mongoose.connect(uri)
//     .then(() => console.log('MongoDB connection established'))
//     .catch((error) => console.log("MongoDB connection error:", error.message));

// socketHandler(io);

// server.listen(port, () =>{
//     console.log(`Server running on port ${port}`) 
// })
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

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use("/api/users", userRoute);
app.use("/api/friends", friendsRoute);
app.use("/api/feeds", feedRoute);

// Kiểm tra API hoạt động
app.get("/", (req, res) => {
    res.send("Hello, World!");
});

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
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

app.use("/api/messages", messageRoute(io));
socketHandler(io);

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
