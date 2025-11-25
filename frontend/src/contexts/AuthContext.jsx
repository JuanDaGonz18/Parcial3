import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(null);

  // Cada vez que cambie el token, decodificamos el usuario
  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser({
        id: payload.userId,
        username: payload.username,
      });
    } catch (err) {
      console.error("Error decoding token", err);
      setUser(null);
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{
      token,
      user,

      login: (t) => {
        setToken(t);
        localStorage.setItem("token", t);
      },

      logout: () => {
        setToken(null);
        localStorage.removeItem("token");
        setUser(null);
      }
    }}>
      {children}
    </AuthContext.Provider>
  );
}
