const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";


async function request(path, options = {}) {
const headers = options.headers || {};


const token = localStorage.getItem("token");
if (token) headers["Authorization"] = "Bearer " + token;


if (options.body && !(options.body instanceof FormData)) {
headers["Content-Type"] = "application/json";
options.body = JSON.stringify(options.body);
}


const res = await fetch(API_BASE + path, { ...options, headers });
const text = await res.text();


let data;
try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }


if (!res.ok) throw data;


return data;
}


export const api = {
login: (u, p) => request("/auth/login", { method: "POST", body: { username: u, password: p } }),
register: (u, p) => request("/auth/register", { method: "POST", body: { username: u, password: p } }),
createRoom: (payload) => request("/rooms/create", { method: "POST", body: payload }),
getHistory: (id) => request(`/rooms/${id}/history?page=1&page_size=20`),

getRooms: () => request("/rooms"),
isMember: (id) => request(`/rooms/${id}/is_member`),
joinRoom: (room_id, password) =>
    request(`/rooms/join`, {
      method: "POST",
      body: { room_id, password }
    }),

deleteRoom: (roomId) =>
    request(`/rooms/del/${roomId}`, { method: "DELETE" }),
getRoomHistory: (id) =>
    request(`/rooms/${id}/history?page=1&page_size=50`),

leaveRoom: (roomId) =>
    request(`/rooms/leave/${roomId}`, { method: "POST" }),
sendMessage: (id, content) =>
    request(`/rooms/${id}/messages`, "POST", { content }),
};