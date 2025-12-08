import React, { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../hooks/useAuth";

export default function ProfilePage() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get("/auth/history");
        setHistory(res.data.history || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load history");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (!user) return null;

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Profile</h2>
      <p style={{ color: "#cbd5e1" }}>???? ????????</p>
      <div className="glass" style={{ display: "grid", gap: 6, marginBottom: 16 }}>
        <div><strong>???:</strong> {user.name}</div>
        <div><strong>Email:</strong> {user.email}</div>
        <div><strong>Role:</strong> {user.role}</div>
      </div>

      <h3>??????? ??????? ???????????</h3>
      {loading && <div>????? ?????...</div>}
      {error && <div className="error">{error}</div>}
      {!loading && !error && (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>?????</th>
                <th>IP</th>
                <th>User Agent</th>
                <th>??????</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id}>
                  <td>{new Date(h.createdAt).toLocaleString()}</td>
                  <td>{h.ip || "-"}</td>
                  <td style={{ maxWidth: 240, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{h.userAgent || "-"}</td>
                  <td style={{ color: h.success ? "#34d399" : "#f87171" }}>{h.success ? "?????????" : "?????????"}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr><td colSpan={4}>???? ????.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
