const amqp = require("amqplib");
const db = require("./db"); // tu pool de postgres

async function startConsumer() {
  const connection = await amqp.connect(process.env.RABBIT_URL || "amqp://rabbit");
  const channel = await connection.createChannel();

  await channel.assertQueue("messages", { durable: true });

  console.log("📥 Consumer está escuchando mensajes...");

  channel.consume("messages", async (msg) => {
    if (!msg) return;

    const data = JSON.parse(msg.content.toString());

    try {
      await db.query(
        `INSERT INTO messages (room_id, user_id, content)
         VALUES ($1, $2, $3)`,
        [data.roomId, data.userId, data.content]
      );

      channel.ack(msg);
      console.log("💾 Mensaje guardado:", data);

    } catch (err) {
      console.error("❌ Error guardando mensaje:", err);
      channel.nack(msg, false, true);
    }
  });
}

startConsumer();
