# 💬 MatchChat

A real-time anonymous chat app where you can meet random people from around the world. Built with React and Socket.io.

![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat&logo=socket.io&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-38B2AC?style=flat&logo=tailwind-css&logoColor=white)

---

## ✨ Features

### 💬 Real-time Messaging
Chat instantly with random strangers. Messages are delivered in real-time using WebSockets.

### ⌨️ Typing Indicator
See when your chat partner is typing a message.

### 🖼️ Image Sharing
Share images directly in the chat (up to 5MB).

### ✓✓ Read Receipts
Know when your messages have been seen by your partner.

### 🌍 Country Flags
Show where you're from with country flags displayed next to your name.

### 🌙 Dark / Light Mode
Switch between dark and light themes based on your preference.

### 🚨 Report & Block
Report inappropriate users and block them from matching with you again.

### 🔊 Sound Notifications
Get notified with sounds when you find a match or receive a message.

### 👥 Online Counter
See how many users are currently online.

---

## 🛠️ Tech Stack

**Frontend:**
- React 19
- Vite
- TailwindCSS
- Socket.io Client

**Backend:**
- Node.js
- Express
- Socket.io
- Resend (for email notifications)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/LukaSukhitashvili/matchmaking-chat.git
cd matchmaking-chat
```

2. Install server dependencies
```bash
cd server
npm install
```

3. Install client dependencies
```bash
cd ../client
npm install
```

4. Create a `.env` file in the server folder (optional, for email reports)
```env
RESEND_API_KEY=your_resend_api_key
```

5. Run the development server
```bash
# In server folder
npm run dev

# In client folder (new terminal)
npm run dev
```

6. Open http://localhost:5173 in your browser

---

## 📁 Project Structure

```
matchmaking-chat/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── context/        # Theme context
│   │   └── utils/          # Sound manager
│   └── ...
├── server/                 # Express backend
│   └── index.js            # Socket.io server
└── README.md
```

---

## 🌐 Deployment

The app is deployed on **Render**:
- Frontend and backend are served from the same server
- Uses Socket.io for real-time communication
- Email reports powered by Resend API

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

---

Made with ❤️ by [Luka Sukhitashvili](https://github.com/LukaSukhitashvili)
