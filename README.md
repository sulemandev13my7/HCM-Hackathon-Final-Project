# HCM Lite - AI-Assisted Human Capital Management

A full-stack HR management system built for the Saylani Hackathon. It covers the complete employee lifecycle with role-based workflows for Admin, HR and Employees, plus an AI assistant that uses the same permission rules as the application.

The app starts empty. There is no seed or demo data: the first admin creates the company and configures the workspace.

## Features

### Core modules

- **First-run setup** - Create the company and first Admin account on an empty database.
- **Authentication and RBAC** - JWT authentication, temporary-password onboarding, forced first-login password change, and role-specific routes.
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

- **Backend:** Node.js, Express 5, MongoDB, Mongoose, JWT, bcryptjs, PDFKit
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
| `JWT_EXPIRE` | Token lifetime, for example `7d` |
| `AI_API_KEY` | Backend-only OpenRouter key; optional |
| `AI_BASE_URL` | Default `https://openrouter.ai/api/v1` |
| `AI_MODEL` | Default `google/gemini-2.5-flash` |
| `CLIENT_URL` | Frontend origin used by CORS |
| `NODE_ENV` | `development` or `production` |
| `DNS_SERVERS` | Optional comma-separated DNS for Atlas SRV lookup |

`CLIENT_URL` also accepts `FRONTEND_URL` or `CORS_ORIGINS`, supports comma-separated origins, and normalizes paths such as `/login`.

If Atlas SRV lookups fail with `ECONNREFUSED`, set `DNS_SERVERS=8.8.8.8,1.1.1.1` or use a direct `mongodb://` URI.

### Configure the frontend

`Frontend\.env`:

```dotenv
VITE_API_BASE_URL=http://localhost:5000/api
```

Vite inlines this value at build time. Changing it in Vercel requires a new deployment.

### Run

Open two PowerShell terminals from the repository root:

```powershell
npm --prefix Backend run dev
```

```powershell
npm --prefix Frontend run dev
```

Open the Vite URL. On a fresh database, the app opens first-run setup. Create the Admin account, configure the organization, then create HR accounts. HR registers employees; each employee receives a temporary password that must be changed at first sign-in.

## Demo flow

1. Complete first-run setup on a fresh database.
2. Configure the company, office location, departments, designations and leave types.
3. Create an HR account and sign in as HR.
4. Register an employee and copy the generated temporary password.
5. Sign in as the employee, change the password and check in with the camera or web button.
6. Ask the AI assistant for leave dates, submit the request, then approve it as HR.
7. HR creates a payroll draft; Admin finalizes it; the employee downloads the payslip.
8. Show dashboards, announcements, notifications and the Admin audit log.

## Deployment

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

Deploy `Frontend` to Vercel with:

```dotenv
VITE_API_BASE_URL=https://<your-render-service>.onrender.com/api
```

Then redeploy. A build that used `http://localhost:5000/api` cannot call a hosted API.

No public backend URL is committed to this repository. Use the first-run setup screen to initialize the deployed database.

## Security

- JWT-protected routes with server-side role checks.
- Passwords hashed with bcrypt.
- Temporary passwords are generated server-side and must be changed on first login.
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

- Backend unit tests: **45/45 passing**.
- Frontend ESLint: passing.
- Frontend production build: passing with route-level code splitting.
- Isolated end-to-end smoke test: **55/55 passing**, covering setup, RBAC, HR self-service, camera geofence rejection and check-in, attendance, leave, payroll, payslip PDFs, dashboards, notifications, announcements, audit logs, CSV import/export, Employee 360, AI chat and smart leave.

The hosted Vercel deployment has not been verified against a public backend in this checkout. A final deployment check is still required.

## Notes

- Starts empty; no dummy data is included.
- All financial and attendance calculations run on the server.
- AI tools inherit the caller's role permissions.
- Mobile layouts are supported from 375px upward.
- Route-level lazy loading keeps the initial frontend bundle small.
