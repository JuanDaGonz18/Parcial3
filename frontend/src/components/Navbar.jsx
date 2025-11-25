import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

export function Navbar() {
  const { user } = useContext(AuthContext);

  return (
    <nav className="backdrop-blur bg-white/60 border-b border-gray-200 shadow-sm px-6 py-3 flex justify-between items-center">
      <h2 className="font-semibold text-xl tracking-tight text-gray-700">Parcial III</h2>

      <div className="flex gap-4 items-center">
        <Link className="nav-btn" to="/">Home</Link>
        <Link className="nav-btn" to="/dashboard">Dashboard</Link>

        {!user && (
          <>
            <Link className="nav-btn" to="/login">Login</Link>
            <Link className="nav-btn" to="/register">Register</Link>
          </>
        )}

        {user && <LogoutButton />}
      </div>
    </nav>
  );
}

function LogoutButton() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  function handleLogout() {
    logout();     
    navigate("/login");
  }

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
    >
      Logout
    </button>
  );
}


// Estilo global para los enlaces del navbar
const navBtn = `
text-gray-700 font-medium hover:text-blue-600 
transition px-3 py-1
`;