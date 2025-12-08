import React, { createContext, useContext, useState } from "react";
import api from "../api";
import { useAuth } from "./useAuth";

const SessionContext = createContext();

export const SessionProvider = ({ children }) => {
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const startSession = async ({ deviceCode, qrCode }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/session/start", { deviceCode, qrCode });
      setSession(res.data.session);
      setDevice(res.data.device);
      return res.data.session;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to start session.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logSet = async (sessionId, payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(`/session/${sessionId}/log`, payload);
      setSession(res.data.session);
      return res.data.session;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save set.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <SessionContext.Provider value={{ session, device, startSession, logSet, loading, error, user }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);
