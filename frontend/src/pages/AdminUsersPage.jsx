import React, { useEffect, useState } from "react";
import api from "../api";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "member" });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/users");
      setUsers(res.data.users || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await api.post("/users", form);
      setForm({ name: "", email: "", password: "", role: "member" });
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create user");
    }
  };

  const handleRoleChange = async (id, role) => {
    try {
      await api.patch(`/users/${id}/role`, { role });
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update role");
    }
  };

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div className="pill" style={{ marginBottom: 8 }}>Admin</div>
          <h2 style={{ marginTop: 0 }}>User management</h2>
          <p style={{ color: "#cbd5e1" }}>Create and update roles (Admin/Trainer/Member).</p>
        </div>
      </div>

      <form onSubmit={handleCreate} style={{ marginTop: 12 }}>
        <div className="form-row" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <div>
            <label className="label">Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <div>
            <label className="label">Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="member">Member</option>
              <option value="trainer">Trainer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <button className="btn" type="submit">Create user</button>
      </form>

      {error && <div className="error">{error}</div>}
      {loading ? (
        <div style={{ marginTop: 12 }}>Loading...</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{new Date(u.createdAt).toLocaleString()}</td>
                <td>
                  <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)}>
                    <option value="member">Member</option>
                    <option value="trainer">Trainer</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
