import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import { z } from "zod";

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
import {
  initDb,
  recordLoginEvent,
  getLoginHistory,
  findUserByEmail,
  createUser,
  listUsers,
  updateUserRole,
} from "./db.js";

dotenv.config();

export const app = express();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Validation schemas
const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(1),
    role: z.enum(["member", "trainer", "admin"]).default("member"),
  }),
});

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
  const { password_hash, passwordHash, ...rest } = user;
  return rest;
};

// Devices (still in-memory for now)
const devices = [
  { id: uuid(), code: "DEV-001", name: "Chest Press", location: "Zone A", isActive: true },
  { id: uuid(), code: "DEV-002", name: "Treadmill 1", location: "Cardio", isActive: true },
  { id: uuid(), code: "DEV-003", name: "Squat Rack", location: "Zone B", isActive: true },
];

// In-memory sessions; could move to DB later
const sessions = [];

// Auth routes
app.post("/api/auth/register", validate(registerSchema), async (req, res, next) => {
  const db = await initDb();
  try {
    const { email, password, name, role } = req.body;
    const exists = await findUserByEmail(db, email.toLowerCase());
    if (exists) throw new ConflictError("Email already exists.");
    const user = await createUser(db, { email: email.toLowerCase(), password, name, role });
    const token = createToken(user);
    res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
});

app.post("/api/auth/login", validate(loginSchema), async (req, res, next) => {
  const db = await initDb();
  const { email, password } = req.body;
  try {
    const user = await findUserByEmail(db, email.toLowerCase());
    const success = !!user && bcrypt.compareSync(password || "", user.password_hash || user.passwordHash);
    await recordLoginEvent(db, {
      userId: user?.id,
      success,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    if (!success) throw new ForbiddenError("Email or password is incorrect.");
    const token = createToken(user);
    return res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
});

app.get(
  "/api/auth/history",
  authenticate(JWT_SECRET),
  requireRole(["member", "trainer", "admin"]),
  async (req, res, next) => {
    try {
      const db = await initDb();
      const history = await getLoginHistory(db, req.user.sub);
      res.json({ history });
    } catch (err) {
      next(err);
    }
  }
);

// Admin: list users
app.get("/api/users", authenticate(JWT_SECRET), requireRole(["admin"]), async (_req, res) => {
  const db = await initDb();
  const users = await listUsers(db);
  res.json({ users });
});

// Admin: create user
app.post(
  "/api/users",
  authenticate(JWT_SECRET),
  requireRole(["admin"]),
  validate(createUserSchema),
  async (req, res, next) => {
    try {
      const db = await initDb();
      const { email, password, name, role } = req.body || {};
      const exists = await findUserByEmail(db, email.toLowerCase());
      if (exists) throw new ConflictError("Email already exists.");
      const user = await createUser(db, { email: email.toLowerCase(), name, password, role });
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
  async (req, res, next) => {
    try {
      const db = await initDb();
      const { role } = req.body || {};
      await updateUserRole(db, { id: req.params.id, role });
      res.json({ ok: true });
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
      const device = devices.find((d) => d.code === code && d.isActive);
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
      sessions.push(session);
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
      const session = sessions.find((s) => s.id === req.params.id);
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

// Health
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// 404 handler
app.use((req, _res, next) => next(new NotFoundError("Route", req.originalUrl)));

// Central error handler
app.use(errorHandler);
