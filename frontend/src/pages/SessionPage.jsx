import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../hooks/useSession";

export default function SessionPage() {
  const { session, device, logSet, loading, error } = useSession();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    type: "strength",
    exerciseName: "",
    weight: 40,
    reps: 10,
    sets: 3,
    distance: 0,
    durationSec: 0,
  });
  const [info, setInfo] = useState(null);

  if (!session) {
    return (
      <div className="card">
        <h2 style={{ marginTop: 0 }}>No active session</h2>
        <p style={{ color: "#cbd5e1" }}>Start a session from the Scan page first.</p>
        <button className="btn" onClick={() => navigate("/scan")}>Go to Scan</button>
      </div>
    );
  }

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setInfo(null);
    try {
      await logSet(session.id, {
        ...form,
        weight: Number(form.weight),
        reps: Number(form.reps),
        sets: Number(form.sets),
        distance: Number(form.distance),
        durationSec: Number(form.durationSec),
      });
      setInfo("Saved");
    } catch (err) {
      // handled via error
    }
  };

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ marginTop: 0 }}>Active session</h2>
          <p style={{ color: "#cbd5e1" }}>Device: <strong>{device?.name}</strong> ({device?.code}) - {device?.location}</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div className="glass stat">
            <span className="label">Total volume</span>
            <span className="value">{session.totalVolume}</span>
          </div>
          <div className="glass stat">
            <span className="label">Sets</span>
            <span className="value">{session.sets.length}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
        <div className="form-row" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <div>
            <label className="label">Type</label>
            <select value={form.type} onChange={(e) => handleChange("type", e.target.value)}>
              <option value="strength">Strength</option>
              <option value="cardio">Cardio</option>
            </select>
          </div>
          <div>
            <label className="label">Exercise name</label>
            <input className="input" value={form.exerciseName} onChange={(e) => handleChange("exerciseName", e.target.value)} placeholder="e.g. Bench Press" />
          </div>
          {form.type === "strength" && (
            <>
              <div>
                <label className="label">Weight (kg)</label>
                <input className="input" type="number" value={form.weight} onChange={(e) => handleChange("weight", e.target.value)} />
              </div>
              <div>
                <label className="label">Reps</label>
                <input className="input" type="number" value={form.reps} onChange={(e) => handleChange("reps", e.target.value)} />
              </div>
              <div>
                <label className="label">Sets</label>
                <input className="input" type="number" value={form.sets} onChange={(e) => handleChange("sets", e.target.value)} />
              </div>
            </>
          )}
          {form.type === "cardio" && (
            <>
              <div>
                <label className="label">Distance (km)</label>
                <input className="input" type="number" value={form.distance} onChange={(e) => handleChange("distance", e.target.value)} />
              </div>
              <div>
                <label className="label">Duration (sec)</label>
                <input className="input" type="number" value={form.durationSec} onChange={(e) => handleChange("durationSec", e.target.value)} />
              </div>
            </>
          )}
        </div>
        {error && <div className="error">{error}</div>}
        {info && <div className="success">{info}</div>}
        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save set"}
        </button>
      </form>

      <div className="list">
        {session.sets.map((s) => (
          <div key={s.id} className="card" style={{ borderColor: "rgba(255,255,255,0.08)", boxShadow: "none" }}>
            <div className="actions" style={{ justifyContent: "space-between" }}>
              <div>
                <strong>{s.exerciseName}</strong> ({s.type})
                <div style={{ color: "#94a3b8" }}>
                  {s.type === "strength" && `${s.weight}kg x ${s.reps} reps x ${s.sets} sets`}
                  {s.type === "cardio" && `${s.distance} km | ${s.durationSec} sec`}
                </div>
              </div>
              <span className="badge">Vol {s.volume}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
