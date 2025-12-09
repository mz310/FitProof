# Долоо хоног 9: Гадаад сан, алдааны боловсруулалт (FitProof)

## Шинэ тохиргоо
- Backend dependency: `zod` (request validation) нэмсэн. Суурилуулах: `cd backend && npm install`.
- Алдааны классууд: `src/errors.js` (AppError, ValidationError, NotFoundError, ForbiddenError, ConflictError, DatabaseError).
- Validation middleware: `src/middleware/validate.js` (zod schema-гаар request-ийг шалгана).
- Төвлөрсөн алдааны боловсруулалт: `src/middleware/errorHandler.js` (AppError төрлийг статус/мессежтэй буцаана; бусад алдааг 500 болгон бүртгэнэ).

## Backend өөрчлөлт (src/index.js)
- /api/auth/login: ValidationError/ForbiddenError ашиглан алдаа буцаана.
- /api/users (create/update role): zod validation, ConflictError, NotFoundError.
- /api/session/start: device code/QR шалгах, NotFoundError/ValidationError.
- /api/session/:id/log: session болон эрх шалгах (ForbiddenError, NotFoundError), validation.
- 404 handler нэмсэн (Route not found).
- Central error handler нэмсэн.

## Алдааны лог ба UX
- Error handler нь алдааг JSON хэлбэрээр буцаана (`error`, `message`, `details`).
- Console-д алдааны лог (method/path/status/name/message/details/stack) хэвлэнэ; Winston/Pino-р дараа сайжруулах боломжтой.
- Frontend-д эдгээр мессежийг ойлгомжтой toast/banner-ээр харуулах боломжтой (API response тогтмол бүтэцтэй болсон).

## Локал шалгах
```bash
cd backend
npm install
npm run dev
```
- /api/health → 200 ok
- /api/session/start (token шаардлагатай): хоосон body → 400 Validation error; буруу device → 404 Device not found.
- /api/session/:id/log: буруу type → 400; session олдохгүй → 404; эрхгүй → 403.
