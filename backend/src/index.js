import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";

import { seedData } from "./data/seed.js";
import { authenticate } from "./middleware/auth.js";
import { requireRole } from "./middleware/requireRole.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

// In-memory data stores (replace with DB later)
const db = seedData();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Utility helpers
const createToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role, email: user.email, name: user.name }, JWT_SECRET, {
    expiresIn: "12h",
  });

const sanitizeUser = (user) => {
  const { passwordHash, ...rest } = user;
  return rest;
};

// Auth routes
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  const user = db.users.find((u) => u.email.toLowerCase() === (email || "").toLowerCase());
  if (!user) {
    return res.status(401).json({ message: "Email or password is incorrect." });
  }
  const valid = bcrypt.compareSync(password || "", user.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: "Email or password is incorrect." });
  }
  const token = createToken(user);
  return res.json({ token, user: sanitizeUser(user) });
});

// Admin: list users
app.get("/api/users", authenticate(JWT_SECRET), requireRole(["admin"]), (req, res) => {
  const users = db.users.map(sanitizeUser);
  res.json({ users });
});

// Admin: create user
app.post("/api/users", authenticate(JWT_SECRET), requireRole(["admin"]), (req, res) => {
  const { email, password, name, role } = req.body || {};
  if (!email || !password || !name || !role) {
    return res.status(400).json({ message: "Email, password, name, and role are required." });
  }
  if (!["member", "trainer", "admin"].includes(role)) {
    return res.status(400).json({ message: "Invalid role." });
  }
  const exists = db.users.some((u) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(409).json({ message: "Email already exists." });
  }
  const id = uuid();
  const passwordHash = bcrypt.hashSync(password, 10);
  const user = { id, email, name, role, passwordHash, createdAt: new Date().toISOString() };
  db.users.push(user);
  res.status(201).json({ user: sanitizeUser(user) });
});

// Admin: update role
app.patch("/api/users/:id/role", authenticate(JWT_SECRET), requireRole(["admin"]), (req, res) => {
  const { role } = req.body || {};
  if (!role || !["member", "trainer", "admin"].includes(role)) {
    return res.status(400).json({ message: "Invalid role." });
  }
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }
  user.role = role;
  res.json({ user: sanitizeUser(user) });
});

// Session start (US1)
app.post("/api/session/start", authenticate(JWT_SECRET), requireRole(["member", "trainer", "admin"]), (req, res) => {
  const { qrCode, deviceCode } = req.body || {};
  const code = (qrCode || deviceCode || "").trim();
  if (!code) {
    return res.status(400).json({ message: "Please provide a QR or device code." });
  }
  const device = db.devices.find((d) => d.code === code && d.isActive);
  if (!device) {
    return res.status(404).json({ message: "Device not found or inactive." });
  }
  const session = {
    id: uuid(),
    userId: req.user.sub,
    deviceId: device.id,
    deviceCode: device.code,
    startedAt: new Date().toISOString(),
    status: "active",
    sets: [],
    totalVolume: 0,
    totalDuration: 0,
  };
  db.sessions.push(session);
  res.status(201).json({ session, device });
});

// Log set/cardio (US2)
app.post("/api/session/:id/log", authenticate(JWT_SECRET), requireRole(["member", "trainer", "admin"]), (req, res) => {
  const session = db.sessions.find((s) => s.id === req.params.id);
  if (!session) {
    return res.status(404).json({ message: "Session not found." });
  }
  if (session.userId !== req.user.sub && req.user.role !== "admin" && req.user.role !== "trainer") {
    return res.status(403).json({ message: "You cannot access this session." });
  }
  const { type, exerciseName, weight = 0, reps = 0, sets = 1, distance = 0, durationSec = 0 } = req.body || {};
  if (!type || !["strength", "cardio"].includes(type)) {
    return res.status(400).json({ message: "Type must be strength or cardio." });
  }
  const entry = {
    id: uuid(),
    type,
    exerciseName: exerciseName || (type === "cardio" ? "Cardio" : "Exercise"),
    weight: Number(weight) || 0,
    reps: Number(reps) || 0,
    sets: Number(sets) || 1,
    distance: Number(distance) || 0,
    durationSec: Number(durationSec) || 0,
    createdAt: new Date().toISOString(),
  };

  // Compute volume
  let volume = 0;
  if (type === "strength") {
    volume = entry.weight * entry.reps * entry.sets;
  } else {
    volume = entry.distance || entry.durationSec;
  }
  entry.volume = volume;
  session.sets.push(entry);
  session.totalVolume = session.sets.reduce((sum, s) => sum + (s.volume || 0), 0);
  session.totalDuration = session.sets.reduce((sum, s) => sum + (s.durationSec || 0), 0);

  res.status(201).json({ session });
});

// Simple health check
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Server error." });
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
