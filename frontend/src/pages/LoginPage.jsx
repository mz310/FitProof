import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import api from "../api";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin123");
  const [name, setName] = useState("New Member");
  const [regEmail, setRegEmail] = useState("new@example.com");
  const [regPassword, setRegPassword] = useState("member123");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await login(email, password);
      const redirectTo = location.state?.from?.pathname || "/scan";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await api.post("/auth/register", {
        email: regEmail,
        password: regPassword,
        name,
        role: "member",
      });
      await login(regEmail, regPassword);
      setSuccess("Амжилттай бүртгэж нэвтэрлээ");
      const redirectTo = location.state?.from?.pathname || "/scan";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 460, margin: "0 auto" }}>
      <div className="pill" style={{ marginBottom: 12 }}>FitProof - Access</div>
      <h2 style={{ marginTop: 0 }}>Welcome back</h2>
      <p style={{ color: "#cbd5e1" }}>Use seeded accounts: admin@example.com (admin123), trainer@example.com (trainer123), member@example.com (member123).</p>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <label className="label">Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="form-row">
          <label className="label">Password</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
        <button className="btn" type="submit" disabled={loading} style={{ width: "100%", marginTop: 10 }}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div style={{ marginTop: 24, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 16 }}>
        <h3 style={{ margin: "0 0 8px 0" }}>Register new member</h3>
        <form onSubmit={handleRegister}>
          <div className="form-row">
            <label className="label">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-row">
            <label className="label">Email</label>
            <input className="input" type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
          </div>
          <div className="form-row">
            <label className="label">Password</label>
            <input className="input" type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required />
          </div>
          <button className="btn" type="submit" disabled={loading} style={{ width: "100%", marginTop: 10 }}>
            {loading ? "Registering..." : "Register & Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
