const { io } = require("socket.io-client");

const socket = io("http://localhost:4000");

socket.on("connect", () => {
  console.log(" conectado:", socket.id);

  socket.emit("join_room", "test");

  socket.emit("send_message", {
    roomId: "test",
    content: "hola desde node",
    user: "julian"
  });
});

socket.on("new_message", (msg) => {
  console.log("📨 recibido:", msg);
});
