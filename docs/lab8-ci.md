# Лаборатори 8: Тасралтгүй интеграцчилал (CI) байгуулах — FitProof

## CI гэж юу вэ?
CI (Continuous Integration) нь кодын өөрчлөлтийг тогтмол нэгтгэж, автоматаар build/test ажиллуулан интеграцийн алдааг эрт илрүүлэх процесс. Давуу тал: эрт алдаа илрүүлнэ, code quality сайжирна, гар алдаа багасна, багийн хамтын ажиллагаа тогтвортой.

## Энэ репод тохируулсан CI (GitHub Actions)
- Trigger: `push` болон `pull_request` (`main`).
- Jobs:
  - Node 20.x дээр backend ба frontend-д `npm ci`.
  - Frontend: `npm run build`.
  - Backend: `npm run test --if-present`, `npm run lint --if-present` (одаохондоо placeholder; тест/lint нэмэгдмэгц ажиллана).
- Workflow файл: `.github/workflows/ci.yml`.

## CI Workflow (товч агуулга)
```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request: { branches: [main] }
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    strategy:
      matrix: { node-version: [20.x] }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: ${{ matrix.node-version }}, cache: npm }
      - run: npm ci
        working-directory: backend
      - run: npm ci
        working-directory: frontend
      - run: npm run build
        working-directory: frontend
      - run: |
          npm run test --if-present
          npm run lint --if-present
        working-directory: backend
```

## Дараагийн сайжруулалт
- Backend test/lint скрипт нэмээд workflow-д бодитоор ажиллуулах.
- Frontend lint (`npm run lint`), unit/e2e tests (`vitest`/`cypress`) нэмэх.
- Matrix-ыг Node 18/20-р өргөжүүлэх.
- Cache-г `actions/cache`-ээр `node_modules`-д нарийвчлах (одоо npm cache ашиглаж байгаа).
- Мэдэгдэл: Slack/Webhook-ээр failure notification (`8398a7/action-slack`) эсвэл email (`dawidd6/action-send-mail`) нэмэх.

## Secrets тохиргоо (хэрэв notification нэмэх бол)
Repository → Settings → Secrets → Actions:
- `SLACK_WEBHOOK` эсвэл `EMAIL_USERNAME` / `EMAIL_PASSWORD` (app password).

## Шалгах заавар (локал)
- Backend: `cd backend && npm ci && npm run test --if-present && npm run lint --if-present`
- Frontend: `cd frontend && npm ci && npm run build`

CI pipeline нь одоохондоо build + placeholder test/lint ажиллуулдаг; тестүүд нэмэгдмэгц шууд хамруулахад бэлэн.***
