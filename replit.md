# Guardian Trading

A comprehensive financial trading platform with KYC/AML compliance, an admin dashboard, and an AI-powered trading assistant.

## Recent Changes
- **JWT + HTTP-only cookie auth system:** `server/routes/auth.ts` — `POST /api/auth/login` now signs a 7-day JWT and sets it as an HTTP-only `guardian_session` cookie (SameSite=Lax in dev, Strict in prod). New `GET /api/auth/me` endpoint reads the cookie, verifies the JWT, and returns full user profile. New `POST /api/auth/logout` clears the cookie. JWT secret uses `SESSION_SECRET` env var (falls back to `ADMIN_JWT_SECRET`).
- **requireUser middleware:** `server/middleware/requireUser.ts` — reads JWT from HTTP-only cookie or `Authorization: Bearer` header. Rejects admin tokens. Attaches `req.user = { email }` for protected routes.
- **Protected AI routes:** All `/api/ai/chat`, `/api/ai/history`, `/api/ai/clear`, `/api/ai/sessions/*` endpoints now require `requireUser`. Email is sourced from the JWT, not the request body.
- **AuthContext + useAuth hook:** `client/context/AuthContext.tsx` — React context that calls `GET /api/auth/me` on mount. Exposes `isAuthenticated`, `user`, `loading`, `refresh()`, `logout()`. Used throughout the dashboard.
- **ProtectedRoute component:** `client/components/ProtectedRoute.tsx` — redirects to `/login` if not authenticated. Shows a shimmer skeleton during auth check.
- **Dashboard gate rewritten:** `client/pages/dashboard/DashboardLayout.tsx` — email now sourced from `useAuth().user` (not sessionStorage). Logout calls `POST /api/auth/logout` to clear server-side cookie. All 12 dashboard routes in `App.tsx` are now wrapped with `<ProtectedRoute>`.
- **Login page updated:** `client/pages/Login.tsx` — adds `credentials: "include"` to login and auth/me fetch calls. After login, calls `GET /api/auth/me` for user status routing.
- **GuardianAiWidget secured:** `client/components/GuardianAiWidget.tsx` — all API fetch calls now include `credentials: "include"`. Widget is only rendered when `useAuth().isAuthenticated` is true.
- **Socket.io real-time system:** `server/lib/socketServer.ts` — Socket.io server initialized on the same HTTP server as Express. JWT auth during handshake (reads `guardian_session` cookie). Users join `user:{email}` rooms on connect. Events: `ai:alert`, `ai:signal`, `trade:executed`, `account:balance_update`, `system:notification`.
- **AI Alert Engine:** `server/lib/aiAlertEngine.ts` — periodic margin call detection (every 5 min). Functions: `emitTradeSignal()`, `emitMarginCall()`, `emitRiskAlert()`, `emitBalanceUpdate()`, `emitTradeExecuted()`, `emitSystemNotification()`.
- **SocketContext:** `client/context/SocketContext.tsx` — connects Socket.io after `isAuthenticated` is true. Disconnects on logout. Shows toast alerts for `ai:alert`, `ai:signal`, `trade:executed`, and `system:notification` events.
- **socket.io + socket.io-client** packages added (v4.8.3).

## Architecture

This is a **pnpm monorepo** with three main services running in parallel:

| Service | Port | Description |
|---|---|---|
| API Server | 3001 | Express.js backend (`server/index.ts` or `artifacts/api-server`) |
| Guardian Trading | 3000 | Main React client frontend (`artifacts/guardian-trading`) |
| Admin KYC | 8080 | Admin dashboard React frontend (`artifacts/admin-kyc`) |

## Key Technologies
- **Frontend:** React 19, Vite, Tailwind CSS 4, TanStack Query, Wouter, Radix UI
- **Backend:** Node.js, Express 5, Drizzle ORM, PostgreSQL, WebSockets, Socket.io v4
- **AI:** OpenAI SDK (trading assistant, fraud detection, real-time alerts)
- **Email:** Resend
- **Auth:** JWT HTTP-only cookies (`guardian_session`), bcryptjs, otplib (2FA)

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
- `PORT` — Set per workflow (3001 for API, 5000 for client, 8080 for admin)
- `SESSION_SECRET` — Secret for signing user JWT session cookies (REQUIRED in prod; falls back to `ADMIN_JWT_SECRET`)
- `ADMIN_JWT_SECRET`, `ADMIN_SECRET`, `INTERNAL_API_KEY`, `USER_DATA_KEY` — Auth secrets (set in .replit userenv)
- `CMC_API_KEY` — CoinMarketCap API key
- `AI_INTEGRATIONS_OPENAI_API_KEY` — Managed by Replit OpenAI integration (auto-provided)
- `AI_INTEGRATIONS_OPENAI_BASE_URL` — Managed by Replit OpenAI integration (auto-provided)
- `RESEND_API_KEY` — For email communications via Resend (must be set manually as a secret)
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
