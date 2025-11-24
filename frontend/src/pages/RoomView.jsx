import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

export function RoomView() {
  const { id: roomId } = useParams();
  const navigate = useNavigate();

  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);  // mensajes en tiempo real
  const [text, setText] = useState("");

  useEffect(() => {
    const s = io("http://localhost:4000"); // tu backend
    setSocket(s);

    // unirse
    s.emit("join_room", roomId);

    // historial inicial temporal
    s.on("room_history", (msgs) => {
      setMessages(msgs);
    });

    // cuando llegue mensaje nuevo
    s.on("new_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      s.disconnect();
    };
  }, [roomId]);

  function sendMessage(e) {
    e.preventDefault();
    if (!text.trim()) return;

    socket.emit("send_message", {
      roomId,
      content: text,
      user: "Usuario", // luego lo cambias por el username real
    });

    setText("");
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 px-4">
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-2xl font-bold">Sala: {roomId}</h1>
        <button
          onClick={() => navigate("/")}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
        >
          Salir
        </button>
      </div>

      <div className="bg-white shadow rounded-xl p-5 h-[60vh] overflow-y-auto border">
        {messages.map((m) => (
          <div key={m.id} className="mb-3 p-3 border rounded bg-gray-50">
            <p className="text-xs text-gray-500">{m.created_at}</p>
            <p className="font-semibold">{m.user}</p>
            <p className="text-gray-700">{m.content}</p>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="mt-4 flex gap-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 px-4 py-3 border rounded-lg"
          placeholder="Escribe un mensaje…"
        />
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg">
          Enviar
        </button>
      </form>
    </div>
  );
}
