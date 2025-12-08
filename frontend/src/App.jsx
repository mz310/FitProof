import React from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import LoginPage from "./pages/LoginPage";
import ScanPage from "./pages/ScanPage";
import SessionPage from "./pages/SessionPage";
import AdminUsersPage from "./pages/AdminUsersPage";

const Protected = ({ children, roles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="container">Loading...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/scan" replace />;
  return children;
};

const Shell = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const linkClass = (path) =>
    location.pathname.startsWith(path) ? "active" : undefined;
  return (
    <div className="app-shell">
      <header className="navbar">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #38bdf8, #7c3aed)", display: "grid", placeItems: "center", fontWeight: 800 }}>
            FP
          </div>
          <strong>FitProof</strong>
        </div>
        <div className="nav-links">
          {user && <Link className={linkClass("/scan")} to="/scan">Scan</Link>}
          {user && <Link className={linkClass("/session")} to="/session">Session</Link>}
          {user?.role === "admin" && <Link className={linkClass("/admin")} to="/admin/users">Admin</Link>}
          {user ? (
            <button className="btn secondary" onClick={logout}>Logout</button>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </div>
      </header>
      <main className="container">{children}</main>
    </div>
  );
};

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Shell><LoginPage /></Shell>} />
      <Route path="/scan" element={<Protected><Shell><ScanPage /></Shell></Protected>} />
      <Route path="/session" element={<Protected><Shell><SessionPage /></Shell></Protected>} />
      <Route path="/admin/users" element={<Protected roles={["admin"]}><Shell><AdminUsersPage /></Shell></Protected>} />
      <Route path="*" element={<Navigate to="/scan" />} />
    </Routes>
  );
}
