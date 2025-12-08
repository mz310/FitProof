import React, { createContext, useContext, useEffect, useState } from "react";
import api, { setAuthToken } from "../api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("fitproof_auth");
    if (saved) {
      const { token: t, user: u } = JSON.parse(saved);
      setToken(t);
      setUser(u);
      setAuthToken(t);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    setUser(res.data.user);
    setToken(res.data.token);
    setAuthToken(res.data.token);
    localStorage.setItem("fitproof_auth", JSON.stringify({ token: res.data.token, user: res.data.user }));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setAuthToken(null);
    localStorage.removeItem("fitproof_auth");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
