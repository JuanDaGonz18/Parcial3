import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { useNavigate } from "react-router-dom";

export function Dashboard() {

  const navigate = useNavigate();

  const [roomName, setRoomName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [roomPassword, setRoomPassword] = useState("");
  const [msg, setMsg] = useState(null);
  const [historyHtml, setHistoryHtml] = useState("");

  // 🔥 NUEVO:
  const [rooms, setRooms] = useState([]);

  // -----------------------------------------
  // Fetch rooms at load
  // -----------------------------------------
  useEffect(() => {
    loadRooms();
  }, []);

  async function loadRooms() {
    try {
      const data = await api.getRooms(); // Debes tener GET /rooms en api.js
      setRooms(data.rooms || []);
    } catch (err) {
      console.error("Error loading rooms", err);
    }
  }

  // -----------------------------------------
  // Crear Sala
  // -----------------------------------------
  async function createRoom(e) {
    e.preventDefault();
    setMsg(null);

    try {
      const data = await api.createRoom({
        name: roomName,
        is_private: isPrivate,
        password: roomPassword,
      });

      setMsg("Sala creada ID: " + (data.room?.id || "ok"));

      // recargar lista
      loadRooms();

    } catch (err) {
      setMsg(err?.body?.error || "Error al crear sala");
    }
  }

  // -----------------------------------------
  // Ver historial
  // -----------------------------------------
  async function viewHistory() {
    const rid = prompt("ID de sala?");
    if (!rid) return;

    try {
      const data = await api.getRoomHistory(rid);

      let html = `<strong>Total:</strong> ${data.total}<br/>`;
      data.messages.forEach((m) => {
        html += `
          <div class="mt-2 p-3 border rounded-lg bg-white shadow-sm">
            <small class="text-gray-500">${m.created_at} - <b>${m.username || m.user_id}</b></small>
            <div class="mt-1 text-gray-700">${m.content}</div>
          </div>
        `;
      });

      setHistoryHtml(html);
    } catch (err) {
      setHistoryHtml(`<small class="text-gray-500">${err?.body?.error || "error"}</small>`);
    }
  }

  return (
    <div className="max-w-5xl mx-auto mt-12 px-6">
      
      <h1 className="text-3xl font-semibold text-gray-800 mb-8">
        Panel de Control
      </h1>

      {/* ---------------------------------------------------
         CREAR SALA
      --------------------------------------------------- */}
      <div className="bg-white shadow-lg rounded-xl p-8 border border-gray-100 mb-10">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">
          Crear Nueva Sala
        </h3>

        <form onSubmit={createRoom} className="space-y-5">

          <input
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Nombre de la sala"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
          />

          <label className="flex items-center gap-3 text-gray-700">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="w-4 h-4"
            />
            Sala privada
          </label>

          {isPrivate && (
            <input
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Password (si es privada)"
              value={roomPassword}
              onChange={(e) => setRoomPassword(e.target.value)}
            />
          )}

          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-all">
            Crear Sala
          </button>

          {msg && <p className="text-sm text-gray-600 mt-2">{msg}</p>}
        </form>
      </div>

      {/* ---------------------------------------------------
         LISTA DE SALAS (💥 NUEVO)
      --------------------------------------------------- */}
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Salas creadas</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">

        {rooms.length === 0 && (
          <p className="text-gray-500">No hay salas todavía.</p>
        )}

        {rooms.map((room) => (
          <div
            key={room.id}
            className="bg-white shadow-md border border-gray-100 rounded-xl p-5 flex flex-col justify-between"
          >
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                {room.name}
              </h3>

              <p className="text-sm text-gray-500">
                {room.is_private ? "🔒 Privada" : "🌐 Pública"}
              </p>

              <p className="text-xs text-gray-400 mt-1">
                Creada: {new Date(room.created_at).toLocaleString()}
              </p>
            </div>

            <button
              className="mt-4 bg-gray-800 hover:bg-black text-white py-2 rounded-lg transition"
              onClick={() => navigate(`/room/${room.id}`)}
            >
              Entrar
            </button>
          </div>
        ))}
      </div>

      {/* ---------------------------------------------------
         HISTORIAL
      --------------------------------------------------- */}
      <div className="bg-white shadow-lg rounded-xl p-8 border border-gray-100">
        <h3 className="text-xl font-semibold text-gray-800">Historial de Mensajes</h3>

        <button
          className="mt-4 bg-gray-700 hover:bg-black text-white px-4 py-2 rounded-lg transition"
          onClick={viewHistory}
        >
          Ver historial (prompt)
        </button>

        <div
          className="mt-6 text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: historyHtml }}
        />
      </div>
    </div>
  );
}
