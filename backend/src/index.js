import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import { z } from "zod";

import { seedData } from "./data/seed.js";
import { authenticate } from "./middleware/auth.js";
import { requireRole } from "./middleware/requireRole.js";
import { validate } from "./middleware/validate.js";
import { errorHandler } from "./middleware/errorHandler.js";
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "./errors.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

// In-memory data stores (replace with DB later)
const db = seedData();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Schemas for validation
const startSessionSchema = z.object({
  body: z.object({
    qrCode: z.string().trim().optional(),
    deviceCode: z.string().trim().optional(),
  }),
});

const logSetSchema = z.object({
  body: z.object({
    type: z.enum(["strength", "cardio"]),
    exerciseName: z.string().trim().optional(),
    weight: z.number().optional(),
    reps: z.number().optional(),
    sets: z.number().optional(),
    distance: z.number().optional(),
    durationSec: z.number().optional(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

const createUserSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(1),
    role: z.enum(["member", "trainer", "admin"]),
  }),
});

const updateRoleSchema = z.object({
  body: z.object({
    role: z.enum(["member", "trainer", "admin"]),
  }),
  params: z.object({
    id: z.string(),
  }),
});

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
app.post("/api/auth/login", (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) throw new ValidationError("Email and password are required.");
    const user = db.users.find((u) => u.email.toLowerCase() === (email || "").toLowerCase());
    if (!user) throw new ForbiddenError("Email or password is incorrect.");
    const valid = bcrypt.compareSync(password || "", user.passwordHash);
    if (!valid) throw new ForbiddenError("Email or password is incorrect.");
    const token = createToken(user);
    return res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
});

// Admin: list users
app.get("/api/users", authenticate(JWT_SECRET), requireRole(["admin"]), (_req, res) => {
  const users = db.users.map(sanitizeUser);
  res.json({ users });
});

// Admin: create user
app.post(
  "/api/users",
  authenticate(JWT_SECRET),
  requireRole(["admin"]),
  validate(createUserSchema),
  (req, res, next) => {
    try {
      const { email, password, name, role } = req.body || {};
      const exists = db.users.some((u) => u.email.toLowerCase() === email.toLowerCase());
      if (exists) throw new ConflictError("Email already exists.");
      const id = uuid();
      const passwordHash = bcrypt.hashSync(password, 10);
      const user = { id, email, name, role, passwordHash, createdAt: new Date().toISOString() };
      db.users.push(user);
      res.status(201).json({ user: sanitizeUser(user) });
    } catch (err) {
      next(err);
    }
  }
);

// Admin: update role
app.patch(
  "/api/users/:id/role",
  authenticate(JWT_SECRET),
  requireRole(["admin"]),
  validate(updateRoleSchema),
  (req, res, next) => {
    try {
      const { role } = req.body || {};
      const user = db.users.find((u) => u.id === req.params.id);
      if (!user) throw new NotFoundError("User", req.params.id);
      user.role = role;
      res.json({ user: sanitizeUser(user) });
    } catch (err) {
      next(err);
    }
  }
);

// Session start (US1)
app.post(
  "/api/session/start",
  authenticate(JWT_SECRET),
  requireRole(["member", "trainer", "admin"]),
  validate(startSessionSchema),
  (req, res, next) => {
    try {
      const { qrCode, deviceCode } = req.body || {};
      const code = (qrCode || deviceCode || "").trim();
      if (!code) throw new ValidationError("Please provide a QR or device code.");
      const device = db.devices.find((d) => d.code === code && d.isActive);
      if (!device) throw new NotFoundError("Device", code);
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
    } catch (err) {
      next(err);
    }
  }
);

// Log set/cardio (US2)
app.post(
  "/api/session/:id/log",
  authenticate(JWT_SECRET),
  requireRole(["member", "trainer", "admin"]),
  validate(logSetSchema),
  (req, res, next) => {
    try {
      const session = db.sessions.find((s) => s.id === req.params.id);
      if (!session) throw new NotFoundError("Session", req.params.id);
      if (session.userId !== req.user.sub && req.user.role !== "admin" && req.user.role !== "trainer") {
        throw new ForbiddenError("You cannot access this session.");
      }
      const { type, exerciseName, weight = 0, reps = 0, sets = 1, distance = 0, durationSec = 0 } = req.body || {};
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
    } catch (err) {
      next(err);
    }
  }
);

// Simple health check
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// 404 handler
app.use((req, _res, next) => next(new NotFoundError("Route", req.originalUrl)));

// Central error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
