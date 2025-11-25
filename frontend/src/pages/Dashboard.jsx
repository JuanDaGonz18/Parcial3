import React, { useState, useEffect, useContext } from "react";
import { api } from "../services/api";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [roomName, setRoomName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [roomPassword, setRoomPassword] = useState("");
  const [msg, setMsg] = useState(null);
  const [historyHtml, setHistoryHtml] = useState("");

  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  const [passwordModal, setPasswordModal] = useState({
    open: false,
    roomId: null,
    roomName: "",
    password: "",
    error: null,
  });

  // -----------------------------------------------
  // Load rooms
  // -----------------------------------------------
  useEffect(() => {
    loadRooms();
  }, []);

  async function loadRooms() {
    setLoadingRooms(true);
    try {
      const data = await api.getRooms();
      setRooms(data.rooms || []);
    } catch (err) {
      console.error("Error loading rooms", err);
    }
    setLoadingRooms(false);
  }

  // -----------------------------------------------
  // Create room
  // -----------------------------------------------
  async function createRoom(e) {
    e.preventDefault();
    setMsg(null);

    if (roomName.trim() === "") return setMsg("El nombre no puede estar vacío");
    if (isPrivate && roomPassword.length < 4)
      return setMsg("La contraseña debe tener mínimo 4 caracteres");

    try {
      const data = await api.createRoom({
        name: roomName,
        is_private: isPrivate,
        password: roomPassword,
      });

      setMsg("Sala creada: " + data.room?.id);
      setRoomName("");
      setRoomPassword("");
      setIsPrivate(false);
      loadRooms();
    } catch (err) {
      setMsg(err?.body?.error || "Error creando la sala");
    }
  }

  // -----------------------------------------------
  // Delete room (dev only)
  // -----------------------------------------------
  async function deleteRoom(id) {
    if (!confirm("¿Borrar sala? (solo DEV)")) return;

    try {
      await api.deleteRoom(id);
      loadRooms();
    } catch (err) {
      alert("Error eliminando sala");
    }
  }

  // -----------------------------------------------
  // View history
  // -----------------------------------------------
  async function viewHistory() {
    const rid = prompt("ID de sala:");
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
      setHistoryHtml("<small>Error cargando historial</small>");
    }
  }
  async function handleDelete (roomId) {
    if (!confirm("¿Eliminar sala?")) return;

    try {
      await api.deleteRoom(roomId);
      alert("Sala eliminada");
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Error eliminando sala");
    }
  };

  // -----------------------------------------------
  // Join private room
  // -----------------------------------------------
  async function joinPrivateRoom() {
    try {
      const res = await api.joinRoom(passwordModal.roomId, passwordModal.password);

      navigate(`/room/${passwordModal.roomId}`);

    } catch (err) {
      if (err.error === "already member") {
        // puede entrar sin contraseña
        navigate(`/room/${passwordModal.roomId}`);
      } else {
        setPasswordModal((m) => ({ ...m, error: "Contraseña incorrecta" }));
      }
    }
  }

  async function handleEnterRoom(room) {
  try {
    // 1. verificar si ya es miembro

    const member = await api.isMember(room.id);

    if (member.is_member) {
      navigate(`/room/${room.id}`);
      return;
    }

    // 2. si no es miembro y es privada → pedir contraseña
    let password = "";
    if (room.is_private) {
      password = prompt("Esta sala es privada. Ingresa la contraseña:");
      if (!password) return;
    }

    // 3. llamar join solo si no es miembro
    await api.joinRoom(room.id, password);

    // 4. entrar
    navigate(`/room/${room.id}`);

  } catch (err) {
    console.error(err);

    if (err.error === "invalid password") {
      alert("Contraseña incorrecta.");
      return;
    }

    alert("Error entrando a la sala");
  }
}


  return (
    <div className="max-w-5xl mx-auto mt-12 px-6">
      <h1 className="text-3xl font-semibold text-gray-800 mb-8">
        Panel de Control
      </h1>

      {/* CREATE ROOM */}
      <div className="bg-white shadow-lg rounded-xl p-8 border border-gray-100 mb-10">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">Crear Nueva Sala</h3>

        <form onSubmit={createRoom} className="space-y-5">
          <input
            className="w-full px-4 py-3 rounded-lg border border-gray-300"
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
              className="w-full px-4 py-3 rounded-lg border border-gray-300"
              placeholder="Password"
              value={roomPassword}
              onChange={(e) => setRoomPassword(e.target.value)}
            />
          )}

          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg">
            Crear Sala
          </button>

          {msg && <p className="text-sm text-gray-600 mt-2">{msg}</p>}
        </form>
      </div>

      {/* ROOM LIST */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">Salas creadas</h2>

        <button
          onClick={loadRooms}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          Recargar
        </button>
      </div>

      {loadingRooms ? (
        <p className="text-gray-500">Cargando salas...</p>
      ) : rooms.length === 0 ? (
        <p className="text-gray-500">No hay salas todavía.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-white shadow-md border border-gray-100 rounded-xl p-5 flex flex-col justify-between"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {room.name}
                </h3>

                <p className="text-sm text-gray-500">
                  {room.is_private ? "🔒 Privada" : "🌐 Pública"}
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  Creada: {new Date(room.created_at).toLocaleString()}
                </p>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  className="flex-1 bg-gray-800 hover:bg-black text-white py-2 rounded-lg"
                  onClick={() => handleEnterRoom(room)}
                >
                  Entrar
                </button>


              </div>
            </div>
          ))}
        </div>
      )}

      {/* HISTORY */}
      <div className="bg-white shadow-lg rounded-xl p-8 border border-gray-100 mb-20">
        <h3 className="text-xl font-semibold text-gray-800">Historial de Mensajes</h3>

        <button
          className="mt-4 bg-gray-700 hover:bg-black text-white px-4 py-2 rounded-lg"
          onClick={viewHistory}
        >
          Ver historial (prompt)
        </button>

        <div
          className="mt-6 text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: historyHtml }}
        />
      </div>

      {/* PRIVATE ROOM MODAL */}
      {passwordModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 shadow-lg w-80">
            <h3 className="text-lg font-semibold mb-3">
              Sala privada: {passwordModal.roomName}
            </h3>

            <input
              type="password"
              className="w-full px-3 py-2 border rounded"
              placeholder="Contraseña"
              value={passwordModal.password}
              onChange={(e) =>
                setPasswordModal({ ...passwordModal, password: e.target.value })
              }
            />

            {passwordModal.error && (
              <p className="text-red-500 text-sm mt-2">{passwordModal.error}</p>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setPasswordModal({ open: false })}
                className="px-3 py-1 bg-gray-200 rounded"
              >
                Cancelar
              </button>

              <button
                onClick={joinPrivateRoom}
                className="px-3 py-1 bg-blue-600 text-white rounded"
              >
                Entrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
