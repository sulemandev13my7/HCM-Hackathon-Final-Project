# HCM Lite Architecture

## Runtime

```text
Browser (React 19 / Vite)
  | same-origin /api, httpOnly session cookie
  v
Express 5 API
  | authenticated request establishes AsyncLocalStorage tenant context
  v
MongoDB (Mongoose)

Express AI service ----> OpenRouter (optional; key stays on the backend)
```

The Vite development proxy and Vercel rewrite send `/api` requests to the API. The browser uses cookie sessions; it does not persist access tokens in local storage.

## Authentication and workspace lifecycle

- `POST /api/auth/signup` creates a company workspace, its first Admin, and default leave types in one transaction (with the configured standalone MongoDB fallback).
- Login issues a signed JWT in the `hcm_session` httpOnly cookie. Protected requests reload the active user, check the token version and company claim, then set `req.companyId` and the async tenant context.
- Admin-created HR and employee accounts use temporary passwords and must change them on first sign-in. Admin-issued reset links are single use, short lived, and stored as token hashes.
- There is no global first-run takeover path. A fresh installation starts at `/signup`.

## Tenant data boundaries

- `CompanySettings` is the workspace record. `User` and `CompanySettings` are not tenant-plugin models; user queries must include the authenticated company when they address workspace users.
- Other company-owned models have a required `company` reference and use `Backend/utils/tenantPlugin.js` to scope reads, counts, deletes, updates, replacements, and aggregations to the async request tenant.
- Tenant updates cannot change document ownership. Update pipelines are rejected because their arbitrary stages cannot be safely sanitized.
- Multi-collection writes use `runInTransaction`; standalone MongoDB deployments use the supported fallback.

## Backend modules

```text
Backend/
  ai/            AI provider integration and role-scoped tools
  config/        environment, database, and async tenant context
  controllers/   HTTP orchestration and response handling
  middleware/    authentication, authorization, limits, audit, request context
  models/        Mongoose schemas and indexes
  routes/        API route and middleware composition
  utils/         reusable policies, calculations, transactions, PDF/CSV helpers
  tests/         node:test suites using mocked models and pure helpers
```

Controllers own request orchestration. Shared calculations and policies live in `utils/`; AI tools reuse the application's permission boundaries.

## Frontend modules

```text
Frontend/src/
  components/    shared UI, navigation, and dashboard widgets
  contexts/      authenticated session state
  layouts/       Admin, HR, and Employee shells
  pages/         role and workflow screens
  services/api.js cookie-aware API client
```

Routes are role-gated in the frontend for navigation and always authorized again by the API. Route-level lazy loading keeps feature screens out of the initial bundle.

## Data and business rules

- Attendance, leave-day, payroll, and tax calculations run on the backend.
- List routes use bounded pagination where applicable; CSV output escapes spreadsheet formulas.
- Audit snapshots redact credential fields. Production API errors do not return internal diagnostics.
- Optional geofenced camera attendance is disabled until office coordinates are configured.

## Delivery checks

GitHub Actions runs backend tests, frontend lint, and frontend production build on pushes and pull requests targeting `main`. Local commands are documented in `AGENTS.md` and `README.md`.
