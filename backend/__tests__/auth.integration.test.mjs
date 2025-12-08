import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { resetDb } from "../src/db.js";
import { app } from "../src/app.js";

let token;
let sessionId;

before(async () => {
  process.env.DB_PATH = ":memory:";
  await resetDb();
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: "member@example.com", password: "member123" });
  token = res.body.token;
});

after(() => {
  // nothing to close; app is not listening in tests
});

test("rejects empty session start", async () => {
  const res = await request(app)
    .post("/api/session/start")
    .set("Authorization", `Bearer ${token}`)
    .send({});
  assert.equal(res.status, 400);
});

test("starts session and logs strength set", async () => {
  const start = await request(app)
    .post("/api/session/start")
    .set("Authorization", `Bearer ${token}`)
    .send({ deviceCode: "DEV-001" });
  assert.equal(start.status, 201);
  sessionId = start.body.session.id;

  const log = await request(app)
    .post(`/api/session/${sessionId}/log`)
    .set("Authorization", `Bearer ${token}`)
    .send({ type: "strength", exerciseName: "Bench", weight: 60, reps: 10, sets: 3 });
  assert.equal(log.status, 201);
  assert.ok(log.body.session.totalVolume > 0);
});

test("returns login history", async () => {
  const res = await request(app)
    .get("/api/auth/history")
    .set("Authorization", `Bearer ${token}`);
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.history));
});
