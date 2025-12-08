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

// Increase payload limit for image sharing
app.use(express.json({ limit: '10mb' }));

// Serve static files from the client/dist directory in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/dist')));
}

const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for MVP/Dev
        methods: ["GET", "POST"]
    },
    maxHttpBufferSize: 10e6 // 10MB for image sharing
});

// Data Structures
let waitingQueue = []; // Array of socketIds
let activeRooms = {}; // Map roomId -> { user1, user2 }
let users = {}; // Map socketId -> userData
let blockedUsers = {}; // Map socketId -> Set of blocked socketIds
let reports = []; // Array of report logs

// Helper function to get online user count
const getOnlineCount = () => Object.keys(users).length;

// Broadcast online count to all connected clients
const broadcastOnlineCount = () => {
    io.emit('online_count', { count: getOnlineCount() });
};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Initialize blocked set for this user
    blockedUsers[socket.id] = new Set();

    // Send current online count to new connection
    socket.emit('online_count', { count: getOnlineCount() });

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

        // Broadcast updated online count
        broadcastOnlineCount();

        // Try to match (considering blocked users)
        tryMatch();
    });

    // Matching function that respects blocked users
    function tryMatch() {
        if (waitingQueue.length >= 2) {
            // Find two compatible users (not blocking each other)
            for (let i = 0; i < waitingQueue.length; i++) {
                for (let j = i + 1; j < waitingQueue.length; j++) {
                    const user1Id = waitingQueue[i];
                    const user2Id = waitingQueue[j];

                    // Check if either user has blocked the other
                    const user1Blocked = blockedUsers[user1Id] || new Set();
                    const user2Blocked = blockedUsers[user2Id] || new Set();

                    if (!user1Blocked.has(user2Id) && !user2Blocked.has(user1Id)) {
                        // Remove from queue
                        waitingQueue = waitingQueue.filter(id => id !== user1Id && id !== user2Id);

                        // Create a room
                        const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

                        const user1 = users[user1Id];
                        const user2 = users[user2Id];

                        if (!user1 || !user2) return;

                        // Join socket.io room
                        io.sockets.sockets.get(user1Id)?.join(roomId);
                        io.sockets.sockets.get(user2Id)?.join(roomId);

                        // Store room info
                        activeRooms[roomId] = { user1: user1Id, user2: user2Id };

                        // Notify users
                        io.to(user1Id).emit('room_created', {
                            roomId,
                            partner: { id: user2Id, name: user2.name, gender: user2.gender, country: user2.country, countryCode: user2.countryCode }
                        });
                        io.to(user2Id).emit('room_created', {
                            roomId,
                            partner: { id: user1Id, name: user1.name, gender: user1.gender, country: user1.country, countryCode: user1.countryCode }
                        });

                        console.log(`Match made: ${user1.name} <-> ${user2.name} in ${roomId}`);
                        return;
                    }
                }
            }
        }
    }

    // Handle Messages (with message ID for read receipts)
    socket.on('send_message', ({ roomId, message, messageId }) => {
        socket.to(roomId).emit('receive_message', { message, senderId: socket.id, messageId });
    });

    // Handle Emojis
    socket.on('send_emoji', ({ roomId, emoji, messageId }) => {
        socket.to(roomId).emit('receive_emoji', { emoji, senderId: socket.id, messageId });
    });

    // === TYPING INDICATOR ===
    socket.on('typing_start', ({ roomId }) => {
        socket.to(roomId).emit('partner_typing');
    });

    socket.on('typing_stop', ({ roomId }) => {
        socket.to(roomId).emit('partner_stop_typing');
    });

    // === IMAGE SHARING ===
    socket.on('send_image', ({ roomId, imageData, messageId }) => {
        // Validate image data (basic check)
        if (imageData && imageData.startsWith('data:image/')) {
            // Check size (roughly 5MB limit for base64)
            if (imageData.length <= 7 * 1024 * 1024) {
                socket.to(roomId).emit('receive_image', { imageData, senderId: socket.id, messageId });
            } else {
                socket.emit('error', { message: 'Image too large. Max 5MB.' });
            }
        }
    });

    // === READ RECEIPTS ===
    socket.on('messages_seen', ({ roomId, messageIds }) => {
        socket.to(roomId).emit('messages_read', { messageIds, seenBy: socket.id });
    });

    // === REPORT USER ===
    socket.on('report_user', ({ roomId, partnerId, reason, details }) => {
        const report = {
            timestamp: new Date().toISOString(),
            reporterId: socket.id,
            reportedId: partnerId,
            roomId,
            reason,
            details: details || ''
        };
        reports.push(report);
        console.log('User reported:', report);

        // Acknowledge report
        socket.emit('report_submitted', { success: true, message: 'Report submitted. Thank you for helping keep our community safe.' });
    });

    // === BLOCK USER ===
    socket.on('block_user', ({ partnerId }) => {
        if (!blockedUsers[socket.id]) {
            blockedUsers[socket.id] = new Set();
        }
        blockedUsers[socket.id].add(partnerId);
        console.log(`User ${socket.id} blocked ${partnerId}`);

        socket.emit('user_blocked', { success: true, blockedId: partnerId });
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
        broadcastOnlineCount();
    });

    // Handle Disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Remove from queue
        waitingQueue = waitingQueue.filter(id => id !== socket.id);
        delete users[socket.id];
        delete blockedUsers[socket.id];

        // Find active room and notify partner
        for (const [roomId, room] of Object.entries(activeRooms)) {
            if (room.user1 === socket.id || room.user2 === socket.id) {
                socket.to(roomId).emit('partner_disconnected');
                delete activeRooms[roomId];
                break;
            }
        }

        // Broadcast updated online count
        broadcastOnlineCount();
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
