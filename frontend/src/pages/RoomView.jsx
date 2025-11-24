import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { io } from "socket.io-client";

export function RoomView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState("");

  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  // 1. Cargar historial
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await api.getRoomHistory(id);
        setMessages(res.messages.reverse()); 
      } catch (err) {
        console.error(err);
      }
    }
    loadHistory();
  }, [id]);

  // 2. Conectar WebSocket + unirse a sala
  useEffect(() => {
    socketRef.current = io("http://localhost:4000");  // tu backend

    socketRef.current.emit("join_room", id);

    socketRef.current.on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [id]);

  // Scroll al final
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendMessage() {
    if (!msgInput.trim()) return;

    const payload = {
      roomId: id,
      content: msgInput,
      username: localStorage.getItem("username") || "Usuario"
    };

    socketRef.current.emit("send_message", payload);
    setMsgInput("");
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 px-6">
      <button
        className="mb-4 text-blue-600 underline"
        onClick={() => navigate("/dashboard")}
      >
        ← Volver al Dashboard
      </button>

      <div className="bg-white shadow-md rounded-xl p-6 h-[70vh] flex flex-col">

        <h2 className="text-2xl font-bold mb-4">Sala #{id}</h2>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {messages.map((m, i) => (
            <div key={i} className="p-3 bg-gray-100 rounded-lg">
              <small className="text-gray-500">
                <b>{m.username}</b> – {m.created_at || ""}
              </small>
              <p className="text-gray-800">{m.content}</p>
            </div>
          ))}
          <div ref={bottomRef}></div>
        </div>

        {/* Caja de texto */}
        <div className="mt-4 flex gap-2">
          <input
            className="flex-1 px-4 py-3 border rounded-lg"
            placeholder="Escribe un mensaje…"
            value={msgInput}
            onChange={(e) => setMsgInput(e.target.value)}
          />
          <button
            className="bg-blue-600 text-white px-6 rounded-lg"
            onClick={sendMessage}
          >
            Enviar
          </button>
        </div>

      </div>
    </div>
  );
}
