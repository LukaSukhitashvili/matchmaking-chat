# 💬 MatchChat

> A fun hobby project — real-time anonymous chat app where you can meet random people from around the world.

![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat&logo=socket.io&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-38B2AC?style=flat&logo=tailwind-css&logoColor=white)

<p align="center">
  <img src="https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif" alt="Chat Animation" width="400"/>
</p>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 💬 **Real-time Messaging** | Chat instantly using WebSockets |
| ⌨️ **Typing Indicator** | See when your partner is typing |
| 🖼️ **Image Sharing** | Share images up to 5MB |
| ✓✓ **Read Receipts** | Know when messages are seen |
| 🌍 **Country Flags** | Display your country flag |
| 🌙 **Dark / Light Mode** | Toggle your preferred theme |
| 🚨 **Report & Block** | Keep the community safe |
| 🔊 **Sound Notifications** | Audio alerts for matches and messages |
| 👥 **Online Counter** | See active users count |

---

## 🛠️ Tech Stack

**Frontend:** React 19, Vite, TailwindCSS, Socket.io Client

**Backend:** Node.js, Express, Socket.io, Resend (emails)

---

## 🚀 Getting Started

### Local Development

1. **Clone the repo**
```bash
git clone https://github.com/LukaSukhitashvili/matchmaking-chat.git
cd matchmaking-chat
```

2. **Install dependencies**
```bash
cd server && npm install
cd ../client && npm install
```

3. **Run development servers**
```bash
# Terminal 1 - Server
cd server && npm run dev

# Terminal 2 - Client
cd client && npm run dev
```

4. Open **http://localhost:5173**

---

## 🌐 Deploy to Render (Free)

Want to host your own? Here's how:

### Step 1: Fork this repo
Click the **Fork** button at the top right of this page.

### Step 2: Create a Render account
Go to [render.com](https://render.com) and sign up (free).

### Step 3: Create a new Web Service
1. Click **New** → **Web Service**
2. Connect your GitHub and select your forked repo
3. Configure the service:

| Setting | Value |
|---------|-------|
| **Name** | `matchchat` (or anything you like) |
| **Root Directory** | `server` |
| **Build Command** | `cd ../client && npm install && npm run build && cd ../server && npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | Free |

### Step 4: Add Environment Variables (optional)
For email reports to work, add:
- `RESEND_API_KEY` = your key from [resend.com](https://resend.com)

### Step 5: Deploy!
Click **Create Web Service** and wait a few minutes. Your app will be live! 🎉

---

## 📁 Project Structure

```
matchmaking-chat/
├── client/             # React frontend (Vite)
│   └── src/
│       ├── components/ # UI components
│       ├── context/    # Theme provider
│       └── utils/      # Sound manager
└── server/             # Express + Socket.io backend
    └── index.js
```

---

## 📝 License

MIT License — feel free to use this for learning or your own projects!

---

## 🤝 Contributing

This is a hobby project, but contributions are welcome! Open an issue or PR if you have ideas.

---

<p align="center">
  Made with ❤️ as a fun side project
</p>

