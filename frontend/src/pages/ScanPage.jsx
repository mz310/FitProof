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
          <div className="pill">Зүгээр л log хий. Шалтгаан биш.</div>
          <h1>QR эсвэл код уншуулаад сессээ эхлүүл.</h1>
          <p>Төхөөрөмжийн QR/код уншуулаад strength ба cardio-г нэг урсгалд бүртгэ.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn" onClick={handleStart} disabled={loading}>
              {loading ? "Эхлэж байна..." : "Сесс эхлүүлэх"}
            </button>
            <button className="btn secondary" onClick={() => navigate("/session")}>Лог руу очих</button>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
            <div className="glass stat">
              <span className="label">Сүүлд ашигласан төхөөрөмж</span>
              <span className="value">{device?.name || "Chest Press"}</span>
            </div>
            <div className="glass stat">
              <span className="label">Идэвхтэй сесс</span>
              <span className="value">{session ? "Тийм" : "Үгүй"}</span>
            </div>
          </div>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>QR уншуулах эсвэл код оруулах</h3>
          <div className="form-row">
            <label className="label">Төхөөрөмжийн код</label>
            <input className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="ж: DEV-001" />
          </div>
          <div className="glass" style={{ marginBottom: 12 }}>
            <div style={{ background: "rgba(255,255,255,0.04)", color: "#e5e7eb", padding: 10, borderRadius: 12, marginBottom: 8 }}>QR Scan (камераар)</div>
            <Scanner
              onDecode={(result) => {
                setCode(result);
                setScanError(null);
              }}
              onError={(err) => setScanError(err?.message || "Камер ашиглах боломжгүй эсвэл QR уншигдсангүй.")}
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
          <h3>Сесс эхэлсэн</h3>
          <p>Төхөөрөмж: <strong>{device?.name}</strong> ({device?.code}) - {device?.location}</p>
          <p>Session ID: <code>{session.id}</code></p>
          <button className="btn secondary" onClick={() => navigate("/session")}>Лог руу очих</button>
        </div>
      )}
    </>
  );
}
