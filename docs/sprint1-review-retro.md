# Sprint 1 Review & Retrospective (FitProof)

## Sprint Goal
QR/code суурьтай сесс эхлүүлэх (US1), гар оролтын лог (US2), анхан RBAC ба хэрэглэгч удирдлага (US12).

## Demo Checklist
- Backend: `cd backend && npm install && npm run dev` (`PORT=4000`).
- Frontend: `cd frontend && npm install && npm run dev` (`VITE_API_URL=http://localhost:4000/api`).
- Seed accounts: `admin@example.com/admin123`, `trainer@example.com/trainer123`, `member@example.com/member123`.
- Devices: `DEV-001`, `DEV-002`, `DEV-003`.
- Урьдчилсан шалгалт: /scan → session start → /session лог; /admin/users дээр шинэ user/role update.

## Demo Flow (7–10 мин)
1) Ерөнхий тойм (2 мин): Sprint goal, хүрсэн зүйлс.
2) Үндсэн функц (5–6 мин):
   - US1: /scan — QR/código → session + device info, error/loader.
   - US2: /session — strength/cardio лог, volume, set list, totals.
   - US12: /admin/users — user create, role update, auth guard.
3) Техник (2–3 мин): Stack (Node/Express, React/Vite), JWT auth, in-memory seed, dark hero UI, build/test статус.
4) Q&A (3–5 мин).

## Retrospective
**What went well**
- US1/US2/US12 дууссан; нэгэн загвартай UI; build амжилттай.

**What didn’t go well**
- Persistent DB байхгүй (in-memory seed).
- Offline/cache, validation дутуу.
- Automated тест хязгаарлагдмал.

**Next (action items)**
- DB layer (Postgres/Mongo) + ORM (Prisma/typeorm/sequelize) сонгох, session/user/device persistence.
- Offline queue + form validation (zod/joi) + error UX.
- Smoke/e2e happy-path тест нэмэх; basic unit/integration.

## Burndown хэлэлцэх
- Эхний өдрүүд: эхлэл удаан байвал шалтгааныг тодорхойлох.
- Дунд үе: хурдатгал/төлөвлөгөөнд нийцсэн эсэх.
- Төгсгөл: үлдэгдэл scope, spillover шалтгаан.

## Sprint 2 урьдчилсан зорилт (жишээ)
- Бизнес: Session history/analytics MVP; leaderboard/reward API contract; персистент DB-д хадгалалт.
- Техник: Auth refresh/token rotation; validation/idempotency; error UX, offline cache.
- Чанар: Smoke/E2E happy-path; lint/test in CI; coverage өсгөх зорилт (жишээ 70–80%).
