require('dotenv').config();
const amqp = require("amqplib");

let channel;

async function connectBroker() {
  while (true) {
    try {
      const connection = await amqp.connect(process.env.RABBIT_URL || "amqp://rabbit");
      channel = await connection.createChannel();

      await channel.assertQueue("messages", { durable: true });

      console.log("✅ Conectado a RabbitMQ");
      break; // ✅ sale del loop cuando conecta
    } catch (err) {
      console.log("❗ RabbitMQ no disponible, reintentando en 5s...");
      await new Promise(res => setTimeout(res, 5000));
    }
  }
}

connectBroker();



require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require("http");
const { Server } = require("socket.io");

const logger = require('./logger');
const authRoutes = require('./routes/auth');
const roomsRoutes = require('./routes/rooms');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/rooms', roomsRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});


const roomMessages = {};

io.on("connection", (socket) => {
  console.log("Cliente conectado:", socket.id);

  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    socket.emit("room_history", roomMessages[roomId] || []);
  });

  socket.on("send_message", async ({ roomId, content, user }) => {
    const msg = {
      id: Date.now(),
      roomId,
      content,
      user,
      created_at: new Date().toISOString()
    };

    // guardar historial en memoria
    if (!roomMessages[roomId]) roomMessages[roomId] = [];
    roomMessages[roomId].push(msg);

    // publicar al broker
    if (channel) {
      channel.sendToQueue(
        "messages",
        Buffer.from(JSON.stringify(msg)),
        { persistent: true } // persistencia real
      );

      console.log("enviado a RabbitMQ:", msg);
    } else {
      console.warn("⚠ No hay conexión con RabbitMQ todavía");
    }

    // enviar en tiempo real
    io.to(roomId).emit("new_message", msg);
  });

  socket.on("disconnect", () => {
    console.log("Cliente desconectado");
  });
});


const port = process.env.PORT || 4000;

server.listen(port, () => {
  console.log(`Server + WebSocket corriendo en puerto ${port}`);
});

module.exports = app;



