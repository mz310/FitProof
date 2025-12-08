import request from "supertest";
import { resetDb } from "../src/db.js";
import { app } from "../src/app.js";

let token;
let sessionId;

beforeAll(async () => {
  process.env.DB_PATH = ":memory:";
  await resetDb();
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: "member@example.com", password: "member123" });
  token = res.body.token;
});

describe("Auth and session flow", () => {
  test("rejects empty session start", async () => {
    const res = await request(app)
      .post("/api/session/start")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  test("starts session and logs strength set", async () => {
    const start = await request(app)
      .post("/api/session/start")
      .set("Authorization", `Bearer ${token}`)
      .send({ deviceCode: "DEV-001" });
    expect(start.status).toBe(201);
    sessionId = start.body.session.id;

    const log = await request(app)
      .post(`/api/session/${sessionId}/log`)
      .set("Authorization", `Bearer ${token}`)
      .send({ type: "strength", exerciseName: "Bench", weight: 60, reps: 10, sets: 3 });
    expect(log.status).toBe(201);
    expect(log.body.session.totalVolume).toBeGreaterThan(0);
  });

  test("returns login history", async () => {
    const res = await request(app)
      .get("/api/auth/history")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.history)).toBe(true);
  });
});
