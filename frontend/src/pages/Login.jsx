import { useState, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { api } from "../services/api";
import { useNavigate } from "react-router-dom";


// ---------------------------------------------------
// LOGIN
// ---------------------------------------------------
export function Login() {
  const { login } = useContext(AuthContext);
  const nav = useNavigate();

  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [msg, setMsg] = useState(null);

  async function submit(e) {
    e.preventDefault();
    try {
      const data = await api.login(u, p);
      login(data.token);
      nav("/dashboard");
    } catch (err) {
      setMsg(err.error || "Error de autenticación");
    }
  }

  return (
    <div className="flex justify-center mt-16 px-6">
      <form 
        onSubmit={submit}
        className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border border-gray-100"
      >
        <h2 className="text-2xl font-semibold text-gray-700 mb-6">Iniciar sesión</h2>

        <input 
          className="input"
          placeholder="Username"
          value={u}
          onChange={(e) => setU(e.target.value)}
        />

        <input 
          type="password"
          className="input mt-3"
          placeholder="Password"
          value={p}
          onChange={(e) => setP(e.target.value)}
        />

        <button 
          className="btn-primary w-full mt-6"
          type="submit"
        >
          Entrar
        </button>

        {msg && <p className="text-red-500 mt-3 text-sm">{msg}</p>}
      </form>
    </div>
  );
}