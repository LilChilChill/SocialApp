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
        origin: ["https://chixap.netlify.app", "http://localhost:5173"],
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"]
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



// const { MongoClient } = require("mongodb");
// const fs = require("fs");
// const dbName = "chatApp"
// async function exportCollections() {
//     const client = new MongoClient(uri);
    
//     try {
//       await client.connect();
//       const db = client.db(dbName);
  
//       // Lấy danh sách collection
//       const collections = await db.listCollections().toArray();
//       let databaseData = {};
  
//       for (const collection of collections) {
//         const collectionName = collection.name;
//         const data = await db.collection(collectionName).find().toArray();
//         databaseData[collectionName] = data;
//       }
  
//       // Lưu vào file JSON
//       fs.writeFileSync("mongo_export.json", JSON.stringify(databaseData, null, 2));
//       console.log("✅ Dữ liệu đã được xuất ra file mongo_export.json");
      
//     } catch (error) {
//       console.error("❌ Lỗi khi lấy dữ liệu:", error);
//     } finally {
//       await client.close();
//     }
//   }
  
//   exportCollections();