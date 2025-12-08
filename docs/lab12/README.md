# Lab 12: Continuous Deployment (CD) — FitProof

## Та юу харах вэ?
- `docs/lab12/index.html` — CD-ийн танилцуулга, pipeline-ийн алхмууд, staging vs production харьцуулалт, CD-ийн давуу тал, deploy демо (stub товч).
- CI workflow-д staging deploy stub job нэмсэн (`.github/workflows/ci.yml`).

## CI/CD Stub
- CI: build/test (backend npm ci + frontend build, backend test placeholder).
- CD (stub): main branch дээр `deploy-staging` job echo командаар загварчилсан (ирээдүйд rsync/ssh/docker login/Heroku deploy гэх мэтээр солих).

## Staging vs Production товч
- Staging: prod-тэй ижил конфигурацтай preview орчин; synthetic/huulbar өгөгдөл.
- Production: бодит хэрэглэгчид; monitoring/rollback зайлшгүй.

## Дараагийн алхам
- Staging/Prod deploy-г бодитоор хэрэгжүүлэх (e.g., VPS SSH rsync/docker, Netlify/Heroku action).
- Secrets: GitHub Secrets-д deploy key/ENV.
- Approval: Prod deploy-д manual approval/branch protection.
- Monitoring: health check + rollback script/versioning.
