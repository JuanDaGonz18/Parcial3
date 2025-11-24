require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require("http");
const { Server } = require("socket.io");

const logger = require('./logger');
const authRoutes = require('./routes/auth');
const roomsRoutes = require('./routes/rooms');

const app = express();  // ← PRIMERO SE CREA EXPRESS

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/rooms', roomsRoutes);

const server = http.createServer(app);  // ← AHORA SÍ
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// -------------------------
// SOCKET.IO LOGIC
// -------------------------
const roomMessages = {};

io.on("connection", (socket) => {
  console.log("Cliente conectado:", socket.id);

  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    socket.emit("room_history", roomMessages[roomId] || []);
  });

  socket.on("send_message", ({ roomId, content, user }) => {
    const msg = {
      id: Date.now(),
      content,
      user,
      created_at: new Date().toISOString()
    };

    if (!roomMessages[roomId]) roomMessages[roomId] = [];
    roomMessages[roomId].push(msg);

    io.to(roomId).emit("new_message", msg);
  });

  socket.on("disconnect", () => {
    console.log("Cliente desconectado");
  });
});

// -------------------------
// ARRANQUE DEL SERVIDOR
// -------------------------
const port = process.env.PORT || 4000;

server.listen(port, () => {
  console.log(`Server + WebSocket corriendo en puerto ${port}`);
});

module.exports = app;
