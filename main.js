import express, { json } from 'express'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import cors from 'cors'
import { Server } from 'socket.io';
import http from 'http';
// ----
import ServerRouter from './router/ServerRouter.js';
import FileManagerRouter from './router/FileManagerServerRouter.js';
import ServerSettingRouter from './router/ServerSettingRouter.js'

dotenv.config()

const app = express();

const PORTAPI = process.env.PORT || 3001
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    socket.on('join', roomName => {
        if (!socket.rooms.has(roomName)) {
            console.log(`connect to ${roomName}, ${socket.id}`)
            socket.join(roomName);
        } else {
            console.log('it is a room');
        }
    })

    socket.on('disconnect', () => {
        console.log(`User disconnected ${socket.id}`);
    });
})




mongoose.connect(process.env.URLMDB)
.then(() => {
    console.log("Connected MongoDB");
})
.catch((err) => {
    console.log(`Error = ${err}`);
});

app.use(express.json())
app.use(cors())

app.use('/api/server', ServerSettingRouter);
app.use('/api/server', FileManagerRouter);
app.use('/api', (req, res, next) => {
    req.io = io;
    next();
},ServerRouter);

server.listen(PORTAPI, () => {
    console.log("Start server")
})
/*
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('disconnect', () => {`
        console.log('User disconnected');
    });
});

*/


// app.listen(PORTAPI, () => {

    
//     console.log(`Start API on port = "${PORTAPI}"`);
// })