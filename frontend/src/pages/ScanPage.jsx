import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useSession } from "../hooks/useSession";

export default function ScanPage() {
  const { startSession, device, session, loading, error } = useSession();
  const [code, setCode] = useState("DEV-001");
  const [scanError, setScanError] = useState(null);
  const navigate = useNavigate();

  const handleStart = async () => {
    try {
      await startSession({ deviceCode: code });
      navigate("/session");
    } catch (e) {
      // error handled in context
    }
  };

  return (
    <>
      <div className="hero">
        <div className="hero-left">
          <div className="pill">Just log. No excuses.</div>
          <h1>Start, scan, and own every rep.</h1>
          <p>Kick off a session with a quick QR scan or code entry, then track strength and cardio in one flow.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn" onClick={handleStart} disabled={loading}>
              {loading ? "Starting..." : "Start session"}
            </button>
            <button className="btn secondary" onClick={() => navigate("/session")}>Go to logging</button>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
            <div className="glass stat">
              <span className="label">Latest device</span>
              <span className="value">{device?.name || "Chest Press"}</span>
            </div>
            <div className="glass stat">
              <span className="label">Active session</span>
              <span className="value">{session ? "Yes" : "No"}</span>
            </div>
          </div>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Scan or enter device</h3>
          <div className="form-row">
            <label className="label">Device code</label>
            <input className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. DEV-001" />
          </div>
          <div className="glass" style={{ marginBottom: 12 }}>
            <div style={{ background: "rgba(255,255,255,0.04)", color: "#e5e7eb", padding: 10, borderRadius: 12, marginBottom: 8 }}>QR Scan (camera)</div>
            <Scanner
              onDecode={(result) => {
                setCode(result);
                setScanError(null);
              }}
              onError={(err) => setScanError(err?.message || "Camera not available or QR unreadable.")}
              constraints={{ facingMode: "environment" }}
              styles={{ container: { width: "100%" } }}
            />
            {scanError && <div className="error">{scanError}</div>}
          </div>
          {error && <div className="error">{error}</div>}
        </div>
      </div>

      {session && (
        <div className="card" style={{ marginTop: 20, background: "linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(124, 58, 237, 0.08))", borderColor: "rgba(255,255,255,0.08)" }}>
          <h3>Session started</h3>
          <p>Device: <strong>{device?.name}</strong> ({device?.code}) - {device?.location}</p>
          <p>Session ID: <code>{session.id}</code></p>
          <button className="btn secondary" onClick={() => navigate("/session")}>Go to logging</button>
        </div>
      )}
    </>
  );
}
