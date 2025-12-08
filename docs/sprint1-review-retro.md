# Sprint 1 -ийн ажлын тайлан (FitProof)

## Sprint-ийн зорилго
QR/code суурьтай session start (US1), manual logging (US2), анхан RBAC + user management (US12).

## Ажиллах зарчим
- Backend: cd backend && npm install && npm run dev (PORT=4000).
- Frontend: cd frontend && npm install && npm run dev (VITE_API_URL=http://localhost:4000/api).
- Seed accounts: dmin@example.com/admin123, 	rainer@example.com/trainer123, member@example.com/member123.
- Devices: DEV-001, DEV-002, DEV-003.
- Урьдчилсан шалгалт: /scan → session start → /session log; /admin/users дээр шинэ user/role update.

## Demo Flow (7–10 мин)
1) Ерөнхий тойм (2 мин): Sprint goal, хүрсэн зүйлс.
2) Үндсэн функц (5–6 мин):
   - US1: /scan — QR/code → session + device info, error/loading state.
   - US2: /session — strength/cardio log, volume, set list, totals.
   - US12: /admin/users — user create, role update, auth guard.
3) Техник (2–3 мин): Stack (Node/Express, React/Vite), JWT auth, in-memory seed, dark hero UI, build/test статус.
4) Q&A (3–5 мин).

## Retrospective
**Дууссан ажлууд**
- US1/US2/US12 дууссан; нэгэн загвартай UI; build амжилттай.

**Амжилтгүй болсон ажлууд**
- Persistent DB байхгүй (in-memory seed).
- Offline/cache, validation дутуу.
- Automated test хязгаарлагдмал.

**Дараагийн хийх ажлууд**
- US3 (8 SP): Жин/өндөр/нас → recommended/max зөвлөмж (аюулгүй байдлын үндэс)
- US6 (5 SP): Прогресс/XP-г апп-аар харах (элементар график/карт)
- US7 (5 SP): Трэнер: хэрэглэгчийн өнөөдрийн өгөгдөл бодитоор харах

## Burndown хэлэлцэх
- Эхний өдрүүд: эхлэл удаан байвал шалтгааныг тодорхойлох.
- Дунд үе: хурдатгал/төлөвлөгөөнд нийцсэн эсэх.
- Төгсгөл: үлдэгдэл scope, spillover шалтгаан.

## Sprint 2 урьдчилсан зорилт (жишээ)
- Бизнес: Session history/analytics MVP; leaderboard/reward API contract; persistent DB-д хадгалалт.
- Техник: Auth refresh/token rotation; validation/idempotency; error UX, offline cache.
- Чанар: Smoke/E2E happy-path; lint/test in CI; coverage өсгөх зорилт (жишээ 70–80%).
