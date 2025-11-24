const amqp = require("amqplib");
const db = require("./db");

async function startConsumer() {
  const connection = await amqp.connect("amqp://rabbit");
  const channel = await connection.createChannel();
  await channel.assertQueue("messages");

  console.log("👂 Listening for messages...");

  channel.consume("messages", async (msg) => {
    const data = JSON.parse(msg.content.toString());

    // persist message
    await db.query(
      `INSERT INTO messages (room_id, user_id, content, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [data.roomId, data.userId, data.text]
    );

    console.log(" saved message:", data);

    channel.ack(msg);
  });
}

startConsumer();
