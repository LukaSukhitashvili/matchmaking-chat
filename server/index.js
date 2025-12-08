require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');

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

// Email configuration for reports
const REPORT_EMAIL = 'okaybrooiii@gmail.com';

// Create email transporter (using Gmail SMTP - requires app password)
// For production, set GMAIL_USER and GMAIL_APP_PASSWORD in environment variables
const emailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER || '',
        pass: process.env.GMAIL_APP_PASSWORD || ''
    }
});

// Data Structures
let connectedSockets = new Set(); // Track all connected sockets for accurate count
let waitingQueue = []; // Array of socketIds
let activeRooms = {}; // Map roomId -> { user1, user2 }
let users = {}; // Map socketId -> userData
let blockedUsers = {}; // Map socketId -> Set of blocked socketIds
let reports = []; // Array of report logs

// Helper function to get online user count (excluding a specific user)
const getOnlineCountExcluding = (excludeSocketId) => {
    // Count all connected sockets minus 1 (the requesting user)
    return Math.max(0, connectedSockets.size - 1);
};

// Send personalized online count to each user (excluding themselves)
const broadcastOnlineCount = () => {
    connectedSockets.forEach(socketId => {
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
            socket.emit('online_count', { count: getOnlineCountExcluding(socketId) });
        }
    });
};

// Send email report
async function sendReportEmail(report, reporterName, reportedName) {
    console.log('Attempting to send report email...');
    console.log('GMAIL_USER configured:', !!process.env.GMAIL_USER);
    console.log('GMAIL_APP_PASSWORD configured:', !!process.env.GMAIL_APP_PASSWORD);

    // Only send if email credentials are configured
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        console.log('Email not configured. Missing credentials. Report logged to console only.');
        return;
    }

    const mailOptions = {
        from: process.env.GMAIL_USER,
        to: REPORT_EMAIL,
        subject: `🚨 MatchChat Report: ${report.reason}`,
        html: `
            <h2>New User Report</h2>
            <p><strong>Time:</strong> ${report.timestamp}</p>
            <p><strong>Reporter:</strong> ${reporterName} (${report.reporterId})</p>
            <p><strong>Reported User:</strong> ${reportedName} (${report.reportedId})</p>
            <p><strong>Reason:</strong> ${report.reason}</p>
            <p><strong>Details:</strong> ${report.details || 'No additional details provided'}</p>
            <p><strong>Room ID:</strong> ${report.roomId}</p>
            <hr>
            <p style="color: gray; font-size: 12px;">This is an automated report from MatchChat.</p>
        `
    };

    try {
        console.log('Sending email to:', REPORT_EMAIL);
        const result = await emailTransporter.sendMail(mailOptions);
        console.log('Report email sent successfully! Message ID:', result.messageId);
    } catch (error) {
        console.error('Failed to send report email. Full error:', error);
    }
}

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Track this connection
    connectedSockets.add(socket.id);

    // Initialize blocked set for this user
    blockedUsers[socket.id] = new Set();

    // Send current online count to new connection (excluding themselves)
    socket.emit('online_count', { count: getOnlineCountExcluding(socket.id) });

    // Broadcast updated count to everyone
    broadcastOnlineCount();

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

        // Add to queue if not already in it
        if (!waitingQueue.includes(socket.id)) {
            waitingQueue.push(socket.id);
        }
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
        const reporterName = users[socket.id]?.name || 'Unknown';
        const reportedName = users[partnerId]?.name || 'Unknown';

        const report = {
            timestamp: new Date().toISOString(),
            reporterId: socket.id,
            reporterName,
            reportedId: partnerId,
            reportedName,
            roomId,
            reason,
            details: details || ''
        };
        reports.push(report);
        console.log('User reported:', report);

        // Send email notification
        sendReportEmail(report, reporterName, reportedName);

        // Acknowledge report
        socket.emit('report_submitted', { success: true, message: 'Report submitted. Thank you for helping keep our community safe.' });
    });

    // === BLOCK USER ===
    socket.on('block_user', ({ partnerId, roomId }) => {
        if (!blockedUsers[socket.id]) {
            blockedUsers[socket.id] = new Set();
        }
        blockedUsers[socket.id].add(partnerId);
        console.log(`User ${socket.id} blocked ${partnerId}`);

        // End the current chat if in a room
        if (roomId) {
            // Notify the blocked partner they've been disconnected
            socket.to(roomId).emit('partner_disconnected');

            // Leave the room
            const room = activeRooms[roomId];
            if (room) {
                io.sockets.sockets.get(partnerId)?.leave(roomId);
                delete activeRooms[roomId];
            }
            socket.leave(roomId);
        }

        // Send blocked user list to client
        socket.emit('user_blocked', {
            success: true,
            blockedId: partnerId,
            blockedList: Array.from(blockedUsers[socket.id])
        });
    });

    // === UNBLOCK USER ===
    socket.on('unblock_user', ({ oderId }) => {
        if (blockedUsers[socket.id]) {
            blockedUsers[socket.id].delete(oderId);
            console.log(`User ${socket.id} unblocked ${oderId}`);
        }

        socket.emit('user_unblocked', {
            success: true,
            unblockedId: oderId,
            blockedList: Array.from(blockedUsers[socket.id] || [])
        });
    });

    // === GET BLOCKED LIST ===
    socket.on('get_blocked_list', () => {
        socket.emit('blocked_list', {
            blockedList: Array.from(blockedUsers[socket.id] || [])
        });
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

        // Remove from connected sockets
        connectedSockets.delete(socket.id);

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
