# AGENTS.md

## Project
HCM Lite: React 19 + Vite frontend and Express 5 + MongoDB backend for HR workflows (employees, attendance, leave, payroll, announcements, AI).

## Commands
Run from the named directory.

- Backend tests: `cd Backend; npm test` (`node --test`, 54 tests)
- Backend dev server: `cd Backend; npm run dev` (port 5000)
- Frontend lint: `cd Frontend; npm run lint`
- Frontend build: `cd Frontend; npm run build`
- Deploy production frontend: from repo root, `npx vercel --prod --yes`

## Layout
- `Backend/server.js`: Express app, middleware order, route mounting, health check.
- `Backend/routes/`: route definitions; mount new routers in `server.js`.
- `Backend/controllers/`: request handlers and business logic.
- `Backend/models/`: Mongoose schemas.
- `Backend/middleware/`: auth, rate limiting, CSV upload, error handling.
- `Backend/utils/`: pure helpers and shared policy (password, pagination, CSV, transactions).
- `Backend/tests/`: `node:test` suites with mocked models; no live database required.
- `Frontend/src/pages/`: route screens, grouped by role/module.
- `Frontend/src/layouts/`, `components/`, `contexts/`, `services/`: shell, shared UI, auth state, API client.
- `Frontend/src/index.css`: Tailwind 4 theme tokens and shared component classes.

## Conventions
- Auth uses the httpOnly `hcm_session` cookie. Do not store JWTs or user records in localStorage.
- Frontend API calls go through `Frontend/src/services/api.js`; base URL is `/api` (Vite proxies it to port 5000).
- New passwords require 12+ chars with upper, lower, number, and symbol. Reuse `Backend/utils/passwordPolicy.js` and `Frontend` password checks.
- Use `runInTransaction` for multi-collection writes; it falls back on standalone MongoDB.
- Use `parsePagination` for list endpoints; cap limits.
- Use `escapeCsvValue` for generated CSV cells.
- Keep controllers thin; put reusable logic in `Backend/utils/`.
- Do not print or commit secrets from `.env`.
- Do not reset production data. Local development uses `mongodb://127.0.0.1:27017/hcm_lite`.

## Verification
Before finishing any code change run the relevant commands above. Backend tests and frontend lint/build must pass. Do not commit unless explicitly asked.
