import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";

export const seedData = () => {
  const adminId = uuid();
  const trainerId = uuid();
  const memberId = uuid();
  const devices = [
    { id: uuid(), code: "DEV-001", name: "Chest Press", location: "Zone A", isActive: true },
    { id: uuid(), code: "DEV-002", name: "Treadmill 1", location: "Cardio", isActive: true },
    { id: uuid(), code: "DEV-003", name: "Squat Rack", location: "Zone B", isActive: true },
  ];

  const users = [
    {
      id: adminId,
      name: "Admin",
      email: "admin@example.com",
      role: "admin",
      passwordHash: bcrypt.hashSync("admin123", 10),
      createdAt: new Date().toISOString(),
    },
    {
      id: trainerId,
      name: "Trainer",
      email: "trainer@example.com",
      role: "trainer",
      passwordHash: bcrypt.hashSync("trainer123", 10),
      createdAt: new Date().toISOString(),
    },
    {
      id: memberId,
      name: "Member",
      email: "member@example.com",
      role: "member",
      passwordHash: bcrypt.hashSync("member123", 10),
      createdAt: new Date().toISOString(),
    },
  ];

  const sessions = [];

  return { users, devices, sessions };
};
