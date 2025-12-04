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
let waitingQueue = []; // Array of { socketId, name, gender, country, countryCode }
let activeRooms = {}; // Map roomId -> { user1, user2 }
let users = {}; // Map socketId -> userData

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Handle User Join
    socket.on('join', (userData) => {
        // userData: { name, gender, country, countryCode }
        const { name, gender, country, countryCode } = userData;

        // Store user info
        users[socket.id] = {
            id: socket.id,
            name,
            gender,
            country,
            countryCode
        };

        // Add to queue
        waitingQueue.push(socket.id);
        console.log(`User ${name} joined queue. Queue length: ${waitingQueue.length}`);

        // Try to match
        if (waitingQueue.length >= 2) {
            const user1Id = waitingQueue.shift();
            const user2Id = waitingQueue.shift();

            // Prevent matching with self (shouldn't happen but good to check)
            if (user1Id === user2Id) {
                waitingQueue.push(user1Id);
                return;
            }

            // Create a room
            const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            const user1 = users[user1Id];
            const user2 = users[user2Id];

            // Join socket.io room
            io.sockets.sockets.get(user1Id)?.join(roomId);
            io.sockets.sockets.get(user2Id)?.join(roomId);

            // Store room info
            activeRooms[roomId] = { user1: user1Id, user2: user2Id };

            // Notify users
            io.to(user1Id).emit('room_created', {
                roomId,
                partner: { name: user2.name, gender: user2.gender, country: user2.country, countryCode: user2.countryCode }
            });
            io.to(user2Id).emit('room_created', {
                roomId,
                partner: { name: user1.name, gender: user1.gender, country: user1.country, countryCode: user1.countryCode }
            });

            console.log(`Match made: ${user1.name} <-> ${user2.name} in ${roomId}`);
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
        waitingQueue = waitingQueue.filter(id => id !== socket.id);
        delete users[socket.id];
    });

    // Handle Disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Remove from queue
        waitingQueue = waitingQueue.filter(id => id !== socket.id);
        delete users[socket.id];

        // Find active room and notify partner
        for (const [roomId, room] of Object.entries(activeRooms)) {
            if (room.user1 === socket.id || room.user2 === socket.id) {
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
