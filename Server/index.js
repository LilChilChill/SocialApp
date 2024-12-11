const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const http = require('http')
const userRoute = require('./Routes/userRoute')
const friendsRoute = require('./Routes/friendRoute')

const app = express()
module.exports = app
require('dotenv').config()

app.use(express.json())
app.use(cors())
app.use("/api/users", userRoute)
app.use("/api/friends", friendsRoute)

const server = http.createServer(app)

app.get("/", (req, res) => {
    res.send("Hello, World!");
});

const port = process.env.PORT || 5001;
const uri = process.env.ATLAS_URI

mongoose.connect(uri)
    .then(() => console.log('MongoDB connection established'))
    .catch((error) => console.log("MongoDB connection error:", error.message));

server.listen(port, () =>{
    console.log(`Server running on port ${port}`) 
})