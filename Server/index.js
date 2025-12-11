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
// --- CORS robust handler (place this BEFORE routes) ---
const allowedOrigins = [
  "https://chi404.id.vn",
  "https://www.chi404.id.vn",
  "https://chixap.netlify.app",
  "https://chixap.netlify.app/",   // sometimes with trailing slash
  "http://localhost:5173"
];

const corsOptions = {
  origin: function(origin, callback) {
    // allow requests with no origin (tools, mobile apps, curl, or same-origin)
    if (!origin) return callback(null, true);

    // if origin exactly matches allowed list -> allow
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // otherwise block
    console.log("⛔ Blocked by CORS origin:", origin);
    return callback(new Error("Not allowed by CORS"), false);
  },
  credentials: true,
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With"]
};

// ensure preflight OPTIONS for all routes ALWAYS returns proper headers
app.options('*', (req, res) => {
  const origin = req.headers.origin || '*';
  // if the request's origin is allowed, echo it back; otherwise use wildcard
  const allowOrigin = (!origin || allowedOrigins.includes(origin)) ? origin || '*' : '*';
  res.header('Access-Control-Allow-Origin', allowOrigin);
  res.header('Access-Control-Allow-Methods', corsOptions.methods.join(','));
  res.header('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(','));
  res.header('Access-Control-Allow-Credentials', 'true');
  return res.sendStatus(204);
});

// apply CORS middleware for normal requests
app.use((req, res, next) => {
  cors(corsOptions)(req, res, (err) => {
    // if CORS rejected, we still want to send a 403 instead of hanging
    if (err) {
      console.warn('CORS error:', err.message);
      return res.status(403).send('CORS Forbidden');
    }
    next();
  });
});
// --- end CORS handler ---

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
