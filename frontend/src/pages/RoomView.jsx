import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useParams, useNavigate } from "react-router-dom";

export function RoomView() {
  const { id } = useParams();
  const nav = useNavigate();

  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [meta, setMeta] = useState(null);

  async function loadHistory() {
    try {
      const data = await api.getRoomHistory(id);
      setMessages(data.messages || []);
      setMeta({ total: data.total });
    } catch (err) {
      console.log(err);
      alert("Error cargando mensajes");
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      await api.sendMessage(id, content);
      setContent("");
      await loadHistory();
    } catch (err) {
      alert(err.error || "Error al enviar");
    }
  }

  useEffect(() => {
    loadHistory();
  }, [id]);

  return (
    <div className="flex flex-col h-screen p-4">
      <div className="flex justify-between items-center border-b pb-3">
        <h1 className="text-2xl font-bold">Sala #{id}</h1>
        <button
          className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300"
          onClick={() => nav("/dashboard")}
        >
          Salir
        </button>
      </div>

      {/* mensajes */}
      <div className="flex-1 overflow-y-auto mt-4 bg-white border rounded-lg p-4 space-y-4">
        {messages.map((m) => (
          <div key={m.id} className="border-b pb-2">
            <p className="text-sm text-gray-600">
              <b>{m.username || "Usuario " + m.user_id}</b> –{" "}
              {new Date(m.created_at).toLocaleString()}
            </p>
            <p className="text-gray-800">{m.content}</p>
          </div>
        ))}
      </div>

      {/* enviar mensaje */}
      <form onSubmit={sendMessage} className="mt-4 flex gap-2">
        <input
          className="flex-1 border rounded-lg p-2"
          placeholder="Escribe un mensaje..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button className="bg-blue-600 text-white px-4 rounded-lg hover:bg-blue-700">
          Enviar
        </button>
      </form>
    </div>
  );
}
