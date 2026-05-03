# Guardian Trading

A comprehensive financial trading platform with KYC/AML compliance, an admin dashboard, and an AI-powered trading assistant.

## Recent Changes
- **Global location data expansion:** `client/lib/location/locationService.ts` — expanded from ~90 to 137 countries with state/province data, 701 unique city entries. New countries include all of South/Central America, Caribbean, sub-Saharan Africa, North Africa, Middle East, Central Asia, South/Southeast Asia, and Eastern/Northern Europe. Added `getStateLabel()` support for 30+ country-specific labels (Department, Province, Oblast, etc.).
- **Shared SearchableSelect component:** `client/components/SearchableSelect.tsx` — new shared virtualized dropdown (max 50 items rendered, "Showing X of Y — type to filter" hint for large lists). Replaces identical inline definitions that were duplicated across all three onboarding pages. Mobile-friendly touch targets, keyboard-accessible search-while-open input.
- **Onboarding pages deduplicated:** `PersonalDetails.tsx`, `ProfessionalDetails.tsx`, `IdInformation.tsx` — removed local `SearchableSelect` (and `ChevronDown` where safe) function bodies; all now import from the shared component. `ChevronDown` preserved in `IdInformation` for native `<select>` elements.
- **Custom toast notifications:** `client/lib/guardian-toast.tsx` + `admin/lib/guardian-toast.tsx` — new pill-shaped dark toast system (matching design reference) replaces old Radix toaster in client and inline `actionMsg` state in admin. Supports success/error/warning/info variants with slide-up animation, auto-dismiss (4s), and hover-to-pause. Used via imperative `toast.success()/toast.error()` API across all pages in both apps.
- **Fraud detection alerts:** `server/routes/fraud.ts` + `artifacts/api-server/src/routes/fraud.ts` — fraud engine now fires a high-risk email alert to `ADMIN_EMAIL` whenever a user scores ≥50 (high/critical), throttled to once per 24 hours per user.
- **Critical fix — DB SSL:** `artifacts/api-server/src/lib/db.ts` — changed `rejectUnauthorized: true` to `rejectUnauthorized: false` to fix production database connection failures causing "Service temporarily unavailable" on login/signup.
- **Production build:** All three artifacts built successfully (`guardian-trading/dist/public`, `admin-kyc/dist/public`, `api-server/dist/index.cjs`).
- **Deposit/Withdraw Modal:** `Overview.tsx` — both buttons now open a fund request modal. Requests POST to `/api/user/fund-request`, creating an admin notification and a user confirmation notification.
- **Fund Request Endpoint:** `server/routes/profile.ts` — new `POST /api/user/fund-request` endpoint, validated with `FundRequestSchema`.
- **Security (Zod strict mode):** `server/lib/validation.ts` — `AuthLoginSchema` and `AuthRegisterSchema` now use `.strict()` to reject extra properties.
- **New validation schema:** `FundRequestSchema` added to `server/lib/validation.ts`.

## Architecture

This is a **pnpm monorepo** with three main services running in parallel:

| Service | Port | Description |
|---|---|---|
| API Server | 3001 | Express.js backend (`server/index.ts` or `artifacts/api-server`) |
| Guardian Trading | 3000 | Main React client frontend (`artifacts/guardian-trading`) |
| Admin KYC | 8080 | Admin dashboard React frontend (`artifacts/admin-kyc`) |

## Key Technologies
- **Frontend:** React 19, Vite, Tailwind CSS 4, TanStack Query, Wouter, Radix UI
- **Backend:** Node.js, Express 5, Drizzle ORM, PostgreSQL, WebSockets
- **AI:** OpenAI SDK (trading assistant, fraud detection)
- **Email:** Resend
- **Auth:** JWT, bcryptjs, otplib (2FA)

## Workspace Structure
```
artifacts/
  guardian-trading/   # Main client React app
  admin-kyc/          # Admin KYC dashboard React app
  api-server/         # Production API server
  mockup-sandbox/     # UI prototyping sandbox
lib/
  api-client-react/   # Shared React API client
  api-spec/           # API specs
  api-zod/            # Shared Zod validation schemas
  db/                 # Drizzle ORM schemas
  integrations/       # OpenAI and third-party integrations
server/               # Development API server source
client/               # Alternate client source (dev)
admin/                # Alternate admin source (dev)
```

## Running the Project
All three workflows run in parallel via the "Project" button:
- `API Server`: `PORT=3001 pnpm run dev:server` on port 3001
- `Guardian Trading`: `PORT=5000 API_PORT=3001 pnpm run dev:client` on port 5000 (main webview)
- `Admin KYC`: `PORT=8080 API_PORT=3001 pnpm run dev:admin` on port 8080

## Environment Variables
- `DATABASE_URL` — PostgreSQL connection string (auto-provided by Replit PostgreSQL module)
- `PORT` — Set per workflow (3001 for API, 3000 for client, 8080 for admin)
- `ADMIN_JWT_SECRET`, `ADMIN_SECRET`, `INTERNAL_API_KEY`, `USER_DATA_KEY` — Auth secrets (set in .replit userenv)
- `CMC_API_KEY` — CoinMarketCap API key
- `OPENAI_API_KEY` — For AI trading assistant features
- `RESEND_API_KEY` — For email communications via Resend
- `ADMIN_EMAIL` — Destination address for all admin alert emails (e.g. admin_alerts@guardiantrading.com)
- `SIGNATURE_THRESHOLD` — Pending signature count that triggers a high-pending alert (default: 10)

## Admin Notification System
`server/lib/adminNotifier.ts` sends real-time compliance alerts to `ADMIN_EMAIL` via Resend:

| Function | Trigger |
|---|---|
| `notifyNewUser` | User registers an account |
| `notifyOnboardingComplete` | User completes all KYC onboarding steps |
| `notifySignatureSubmitted` | User submits their electronic signature |
| `notifySignatureVerified` | Admin verifies a user's signature |
| `notifyHighPendingSignatures` | Pending count ≥ `SIGNATURE_THRESHOLD` |
| `notifyHighRiskUser` | Fraud engine flags a high-risk user |
| `notifyAdminAction` | Approve / Reject / Suspend / Ban / Flag / Reactivate actions |
| `notifySecurityAlert` | Security events (failed logins, etc.) |
| `notifyDailySummary` | Scheduled daily compliance report |

All notifications are fire-and-forget (`.catch(() => {})`) so they never block the API response.

## Deployment
- Build: `scripts/build-production.sh`
- Run: `node artifacts/api-server/dist/index.cjs`
- The production server serves both frontend builds as static files
