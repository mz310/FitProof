import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api";
import { useAuth } from "../hooks/useAuth";

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState("New Member");
  const [regEmail, setRegEmail] = useState("new@example.com");
  const [regPassword, setRegPassword] = useState("member123");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

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
    <div className="card" style={{ maxWidth: 480, margin: "0 auto" }}>
      <div className="pill" style={{ marginBottom: 12 }}>FitProof - Register</div>
      <h2 style={{ marginTop: 0 }}>Шинэ гишүүн бүртгүүлэх</h2>
      <p style={{ color: "#cbd5e1" }}>Member эрхтэй шинэ бүртгэл үүсгээд автоматаар нэвтэрнэ.</p>
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
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
        <button className="btn" type="submit" disabled={loading} style={{ width: "100%", marginTop: 10 }}>
          {loading ? "Registering..." : "Register & Sign in"}
        </button>
      </form>
    </div>
  );
}
