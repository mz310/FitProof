import sqlite3 from "sqlite3";
import { open } from "sqlite";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import fs from "fs";
import path from "path";

let dbPromise;

const getDbPath = () => process.env.DB_PATH || "./data/app.db";

export const getDb = async () => {
  if (!dbPromise) {
    const dbPath = getDbPath();
    if (dbPath !== ":memory:") {
      fs.mkdirSync(path.resolve("data"), { recursive: true });
    }
    dbPromise = open({ filename: dbPath, driver: sqlite3.Database });
  }
  return dbPromise;
};

const createTables = async (db) => {
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS login_events (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      success INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      ip TEXT,
      user_agent TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      location TEXT,
      is_active INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      device_id TEXT NOT NULL,
      device_code TEXT NOT NULL,
      started_at TEXT NOT NULL,
      status TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(device_id) REFERENCES devices(id)
    );
    CREATE TABLE IF NOT EXISTS session_sets (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      type TEXT NOT NULL,
      exercise_name TEXT,
      weight REAL,
      reps INTEGER,
      sets INTEGER,
      distance REAL,
      duration_sec INTEGER,
      volume REAL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(session_id) REFERENCES sessions(id)
    );
  `;
  await db.exec(sql);
};

const seedDefaults = async (db) => {
  const defaults = [
    { name: "Admin", email: "admin@example.com", role: "admin", password: "admin123" },
    { name: "Trainer", email: "trainer@example.com", role: "trainer", password: "trainer123" },
    { name: "Member", email: "member@example.com", role: "member", password: "member123" },
  ];
  for (const u of defaults) {
    const existing = await db.get("SELECT id FROM users WHERE email = ?", [u.email]);
    if (!existing) {
      await db.run(
        "INSERT INTO users (id, email, name, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        [uuid(), u.email, u.name, bcrypt.hashSync(u.password, 10), u.role, new Date().toISOString()]
      );
    }
  }

  const deviceSeeds = [
    { code: "DEV-001", name: "Chest Press", location: "Zone A" },
    { code: "DEV-002", name: "Treadmill 1", location: "Cardio" },
    { code: "DEV-003", name: "Squat Rack", location: "Zone B" },
  ];
  for (const d of deviceSeeds) {
    const existing = await db.get("SELECT id FROM devices WHERE code = ?", [d.code]);
    if (!existing) {
      await db.run(
        "INSERT INTO devices (id, code, name, location, is_active) VALUES (?, ?, ?, ?, ?)",
        [uuid(), d.code, d.name, d.location, 1]
      );
    }
  }
};

export const initDb = async () => {
  const db = await getDb();
  await createTables(db);
  await seedDefaults(db);
  return db;
};

export const resetDb = async () => {
  dbPromise = null;
  const db = await getDb();
  await db.exec(
    "DROP TABLE IF EXISTS session_sets; DROP TABLE IF EXISTS sessions; DROP TABLE IF EXISTS devices; DROP TABLE IF EXISTS login_events; DROP TABLE IF EXISTS users;"
  );
  await createTables(db);
  await seedDefaults(db);
  return db;
};

export const recordLoginEvent = async (db, { userId, success, ip, userAgent }) => {
  await db.run(
    "INSERT INTO login_events (id, user_id, success, created_at, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?)",
    [uuid(), userId || null, success ? 1 : 0, new Date().toISOString(), ip || null, userAgent || null]
  );
};

export const getLoginHistory = async (db, userId) => {
  return db.all(
    "SELECT id, user_id as userId, success, created_at as createdAt, ip, user_agent as userAgent FROM login_events WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
    [userId]
  );
};

export const findUserByEmail = async (db, email) => {
  return db.get("SELECT * FROM users WHERE email = ?", [email]);
};

export const findUserById = async (db, id) => {
  return db.get("SELECT * FROM users WHERE id = ?", [id]);
};

export const listUsers = async (db) => {
  return db.all("SELECT id, email, name, role, created_at as createdAt FROM users ORDER BY created_at DESC");
};

export const createUser = async (db, { email, name, password, role }) => {
  const id = uuid();
  const passwordHash = bcrypt.hashSync(password, 10);
  const createdAt = new Date().toISOString();
  await db.run(
    "INSERT INTO users (id, email, name, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    [id, email, name, passwordHash, role, createdAt]
  );
  return { id, email, name, role, createdAt };
};

export const updateUserRole = async (db, { id, role }) => {
  await db.run("UPDATE users SET role = ? WHERE id = ?", [role, id]);
};

// Devices
export const findDeviceByCode = async (db, code) => {
  return db.get("SELECT * FROM devices WHERE code = ? AND is_active = 1", [code]);
};

export const listDevices = async (db) => {
  return db.all("SELECT * FROM devices WHERE is_active = 1 ORDER BY code ASC");
};

// Sessions and sets
export const createSession = async (db, { userId, deviceId, deviceCode }) => {
  const id = uuid();
  const startedAt = new Date().toISOString();
  await db.run(
    "INSERT INTO sessions (id, user_id, device_id, device_code, started_at, status) VALUES (?, ?, ?, ?, ?, ?)",
    [id, userId, deviceId, deviceCode, startedAt, "active"]
  );
  return { id, userId, deviceId, deviceCode, startedAt, status: "active" };
};

export const findSessionById = async (db, id) => {
  return db.get(
    "SELECT id, user_id as userId, device_id as deviceId, device_code as deviceCode, started_at as startedAt, status FROM sessions WHERE id = ?",
    [id]
  );
};

export const addSessionSet = async (db, { sessionId, type, exerciseName, weight, reps, sets, distance, durationSec, volume }) => {
  const id = uuid();
  await db.run(
    `INSERT INTO session_sets (id, session_id, type, exercise_name, weight, reps, sets, distance, duration_sec, volume, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      sessionId,
      type,
      exerciseName || null,
      weight ?? null,
      reps ?? null,
      sets ?? null,
      distance ?? null,
      durationSec ?? null,
      volume ?? null,
      new Date().toISOString(),
    ]
  );
  return id;
};

export const listSessionSets = async (db, sessionId) => {
  return db.all(
    `SELECT id, session_id as sessionId, type, exercise_name as exerciseName, weight, reps, sets, distance, duration_sec as durationSec, volume, created_at as createdAt
     FROM session_sets WHERE session_id = ? ORDER BY created_at ASC`,
    [sessionId]
  );
};
