# HCM Lite - AI-Assisted Human Capital Management

A full-stack HR management system built for the Saylani Hackathon. It covers the complete employee lifecycle with role-based workflows for Admin, HR and Employees, plus an AI assistant that uses the same permission rules as the application.

The app is multi-tenant. Every signup creates an isolated company workspace, its first Admin account and default leave types. There is no seed or demo data.

## Features

### Core modules

- **Self-serve company signup** - Create a company workspace and first Admin account, with all data isolated per company.
- **Admin launch checklist** - Live, data-backed onboarding progress for leave types, HR, employees and the first payroll run.
- **Authentication and RBAC** - Public company signup, httpOnly cookie sessions, temporary-password onboarding, forced first-login password change, admin-issued one-time reset links, and role-specific routes.
- **Organization settings** - Company profile, office hours, grace period, half-day threshold, weekends, departments, designations, leave types and public holidays.
- **Employee management** - Directory, search and filters, Employee 360, CSV import with dry-run validation, CSV export, salary structures and salary history.
- **Attendance** - Web check-in/out, optional camera check-in with geofence validation, HR self-service attendance, company attendance board and correction requests.
- **Leave management** - Apply and cancel leave, balances, working-day calculation, HR approval/rejection, company-wide Admin view and AI smart-leave parsing.
- **Payroll** - Monthly payroll draft, tax and deduction calculations, finalization by Admin, payslip details and PDF downloads.
- **Dashboards** - Role-specific KPIs, attendance trends, department analytics, payroll breakdowns, leave utilization and AI insights.
- **Communication** - Role-targeted announcements, notifications and audit logs with before/after snapshots.
- **AI assistant** - Role-scoped chat with live company data, smart leave parsing, dashboard summaries and policy questions.
- **Responsive premium UI** - Mobile navigation, desktop tables, mobile cards, loading and empty states, accessible dialogs and a consistent visual system.

### Camera attendance

Camera attendance is optional and disabled unless office coordinates are configured in **Settings > Time & attendance**:

1. Set office latitude and longitude.
2. Set an allowed radius (default 150 meters).
3. Camera check-in validates GPS accuracy, distance from the office, and optional browser face detection.

Camera/microphone/geolocation access requires HTTPS in production, or `localhost` during development.

## Tech stack

- **Backend:** Node.js, Express 5, MongoDB, Mongoose, signed JWT sessions in httpOnly cookies, bcryptjs, PDFKit
- **Frontend:** React 19, Vite, Tailwind CSS 4, React Router, Lucide icons, React Hot Toast
- **AI:** OpenRouter API with `google/gemini-2.5-flash`

## Quick start

### Prerequisites

- Node.js 20.19+ or 22.12+
- npm
- A MongoDB database dedicated to this installation
- An OpenRouter API key only if live AI responses are required

### Install

```powershell
cd Backend
npm install
Copy-Item .env.example .env

cd ..\Frontend
npm install
Copy-Item .env.example .env
```

### Configure the backend

Edit `Backend\.env`:

| Variable | Purpose |
| --- | --- |
| `PORT` | API port, default `5000` |
| `MONGO_URI` | Dedicated MongoDB connection string |
| `JWT_SECRET` | Strong random signing secret |
| `JWT_EXPIRE` | Session lifetime, for example `7d` |
| `ALLOW_PRODUCTION_DB_IN_DEVELOPMENT` | Only set to `true` if you intentionally point a non-production server at the production database |
| `AI_API_KEY` | Backend-only OpenRouter key; optional |
| `AI_BASE_URL` | Default `https://openrouter.ai/api/v1` |
| `AI_MODEL` | Default `google/gemini-2.5-flash` |
| `CLIENT_URL` | Frontend origin used by CORS |
| `NODE_ENV` | `development` or `production` |
| `DNS_SERVERS` | Optional comma-separated DNS for Atlas SRV lookup |

`CLIENT_URL` also accepts `FRONTEND_URL` or `CORS_ORIGINS`, supports comma-separated origins, and normalizes paths such as `/login`.

If Atlas SRV lookups fail with `ECONNREFUSED`, set `DNS_SERVERS=8.8.8.8,1.1.1.1` or use a direct `mongodb://` URI.

### Configure the frontend

`Frontend\.env` is optional. Leave `VITE_API_BASE_URL` unset to use same-origin `/api`: Vite proxies `/api` to port 5000 in development, and Vercel rewrites it to the Render API in production.

If you set an absolute URL instead, Vite inlines it at build time and changing it requires a new deployment.

### Run

Open two PowerShell terminals from the repository root:

```powershell
npm --prefix Backend run dev
```

```powershell
npm --prefix Frontend run dev
```

Open the Vite URL. Create a company workspace at `/signup`, configure the organization, then create HR accounts. HR registers employees; each employee receives a temporary password that must be changed at first sign-in.

## Demo flow

1. Sign up a company workspace at `/signup`.
2. Configure the company, office location, departments, designations and leave types.
3. Create an HR account and sign in as HR.
4. Register an employee and copy the generated temporary password.
5. Sign in as the employee, change the password and check in with the camera or web button.
6. Ask the AI assistant for leave dates, submit the request, then approve it as HR.
7. HR creates a payroll draft; Admin finalizes it; the employee downloads the payslip.
8. Show dashboards, announcements, notifications and the Admin audit log.

### Reset between evaluators

Admins can create a single-use password reset link for any active account from **Users & access**. Links expire after 30 minutes and are stored only as a SHA-256 hash. There is no email delivery provider, so users request reset links from their workspace admin.

To wipe the whole demo workspace between evaluators, reset the dedicated database from the operator machine:

```powershell
npm --prefix Backend run db:reset -- --yes
```

This removes every company workspace and its data. `/` and `/signup` then create a fresh workspace. Use it only between demo sessions; there is no undo.

## Deployment

### Live stack

- Frontend: <https://hcm-hackathon-final-project.vercel.app>
- Backend API: <https://hcm-hackathon-final-project.onrender.com/api>
- Health check: <https://hcm-hackathon-final-project.onrender.com/api/health>

The hosted database is intentionally uninitialized. Open `/signup` to create a workspace and admin account.

### Backend

Deploy `Backend` to a Node host such as Render and configure:

```dotenv
NODE_ENV=production
PORT=5000
MONGO_URI=<your-dedicated-atlas-database>
JWT_SECRET=<strong-random-secret>
CLIENT_URL=https://<your-vercel-app>.vercel.app
AI_API_KEY=<backend-only-openrouter-key>
AI_BASE_URL=https://openrouter.ai/api/v1
AI_MODEL=google/gemini-2.5-flash
```

Ensure HTTPS is enabled so camera and geolocation work.

### Frontend

The checked-in `vercel.json` proxies `/api/*` to the Render service, so the browser keeps first-party cookies without cross-site cookie issues. Keep `VITE_API_BASE_URL` unset unless you deliberately want to call a different API host.

The production build is verified to call the hosted backend rather than `localhost`. Use `/signup` to create a workspace in the deployed database.

## Security

- JWT-protected routes with server-side role checks.
- Passwords hashed with bcrypt.
- Temporary passwords are generated server-side and must be changed on first login.
- Password reset links use 256-bit tokens, are stored only as SHA-256 hashes, expire after 30 minutes, and are consumed atomically on first use.
- Signup, login and password-reset endpoints are rate-limited.
- AI API keys stay on the backend.
- Audit snapshots redact credential fields before storage.
- Audit logs record critical create, update, approval, payroll, attendance and authentication events.
- CORS accepts only configured frontend origins.
- Production error responses omit internal error details.
- Never commit `.env` files or real secrets. Rotate any key that has ever been pushed to a public repository.

## Validation

```powershell
npm --prefix Backend test
npm --prefix Frontend run lint
npm --prefix Frontend run build
```

Current local verification:

- Backend unit tests: **70/70 passing**.
- Frontend ESLint: passing.
- Frontend production build: passing with route-level code splitting.
- Multi-tenant API verification: two workspaces created, employee/user/settings/leave-type data isolated, and cross-company employee access rejected with `404`.
- Login and signup checked in a real browser at mobile and desktop widths with custom validation, focus handling and no horizontal overflow.
- Hosted database reset leaves `/` and `/signup` ready for a fresh workspace.

## Notes

- Starts empty; no dummy data is included.
- Multi-tenant by design: every signup creates an isolated company workspace. A deliberate database reset removes all workspaces.
- All financial and attendance calculations run on the server.
- AI tools inherit the caller's role permissions.
- Mobile layouts are supported from 375px upward.
- Route-level lazy loading keeps the initial frontend bundle small.
