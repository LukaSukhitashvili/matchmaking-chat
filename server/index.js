require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Enable CORS for development
app.use(cors());

// Serve static files from the client/dist directory in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/dist')));
}

const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for MVP/Dev
        methods: ["GET", "POST"]
    }
});

// Data Structures
let waitingQueue = []; // Array of { socketId, name, gender, country }
let activeRooms = {}; // Map roomId -> { user1, user2 }

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Handle User Join
    socket.on('join', (userData) => {
        const { name, gender, country } = userData;

        // Simple matchmaking: Check if anyone is in queue
        if (waitingQueue.length > 0) {
            const partner = waitingQueue.shift();

            // Prevent matching with self (shouldn't happen but good to check)
            if (partner.socketId === socket.id) {
                waitingQueue.push(partner);
                return;
            }

            const roomId = `${partner.socketId}#${socket.id}`;

            // Join both to room
            socket.join(roomId);
            io.sockets.sockets.get(partner.socketId)?.join(roomId);

            // Store room info
            activeRooms[roomId] = {
                user1: socket.id,
                user2: partner.socketId
            };

            // Notify both
            io.to(partner.socketId).emit('room_created', {
                roomId,
                partner: { name, gender, country, socketId: socket.id }
            });

            socket.emit('room_created', {
                roomId,
                partner: { name: partner.name, gender: partner.gender, country: partner.country, socketId: partner.socketId }
            });

            console.log(`Match made: ${name} & ${partner.name} in ${roomId}`);

        } else {
            // Add to queue
            waitingQueue.push({ socketId: socket.id, name, gender, country });
            console.log(`User ${name} added to queue. Queue length: ${waitingQueue.length}`);
        }
    });

    // Handle Messages
    socket.on('send_message', ({ roomId, message }) => {
        socket.to(roomId).emit('receive_message', { message, senderId: socket.id });
    });

    // Handle Emojis
    socket.on('send_emoji', ({ roomId, emoji }) => {
        socket.to(roomId).emit('receive_emoji', { emoji, senderId: socket.id });
    });

    // Handle Skip (Disconnect current, find new)
    socket.on('skip_partner', ({ roomId }) => {
        // Notify partner
        socket.to(roomId).emit('partner_disconnected');

        // Leave room
        const room = activeRooms[roomId];
        if (room) {
            const partnerId = room.user1 === socket.id ? room.user2 : room.user1;
            io.sockets.sockets.get(partnerId)?.leave(roomId);
            delete activeRooms[roomId];
        }
        socket.leave(roomId);

        // Re-trigger join logic is handled by client sending 'join' again
    });

    // Handle Stop (Disconnect, leave queue)
    socket.on('stop_chat', ({ roomId }) => {
        if (roomId) {
            socket.to(roomId).emit('partner_disconnected');
            const room = activeRooms[roomId];
            if (room) {
                const partnerId = room.user1 === socket.id ? room.user2 : room.user1;
                io.sockets.sockets.get(partnerId)?.leave(roomId);
                delete activeRooms[roomId];
            }
            socket.leave(roomId);
        }
        // Remove from queue if present
        waitingQueue = waitingQueue.filter(user => user.socketId !== socket.id);
    });

    // Handle Disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Remove from queue
        waitingQueue = waitingQueue.filter(user => user.socketId !== socket.id);

        // Find active room and notify partner
        for (const [roomId, users] of Object.entries(activeRooms)) {
            if (users.user1 === socket.id || users.user2 === socket.id) {
                socket.to(roomId).emit('partner_disconnected');
                delete activeRooms[roomId];
                break;
            }
        }
    });
});

// Handle React Routing (Catch-all) for production
if (process.env.NODE_ENV === 'production') {
    app.get(/.*/, (req, res) => {
        res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
