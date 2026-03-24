# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Analytics Platform

A full SaaS analytics platform is built into this project, accessible at `/analytics`.

### Features
- **Multi-tenant projects** — create projects per website, each gets a unique public API key
- **Embeddable tracking script** — `GET /api/tracking.js` (< 10KB, async, non-blocking)
- **Event ingestion** — `POST /api/events` with bot detection, visitor fingerprinting, session tracking
- **Analytics dashboard** — at `/analytics` with real-time visitors, KPI cards, time-series charts
- **Campaign attribution** — UTM parameter tracking with conversion rates
- **Click heatmaps** — canvas-rendered heatmap overlay per page URL
- **Session replay** — event timeline for individual user sessions
- **AI insights** — automated analysis with actionable recommendations

### Embed Code
```html
<script async src="https://your-domain/api/tracking.js" data-key="YOUR_PUBLIC_KEY"></script>
```

### Custom Events
```js
analytics.track("signup_completed");
analytics.identify("user_123");
analytics.page();
```

### Database Tables
- `analytics_projects` — tracked websites
- `analytics_api_keys` — public keys per project
- `analytics_visitors` — fingerprinted visitors (privacy-safe)
- `analytics_sessions` — session data with UTM attribution
- `analytics_events` — all tracked events with device/browser/OS
- `analytics_heatmap_events` — click coordinates per page
- `analytics_session_recordings` — session replay event logs

### Admin
Default owner email for demo: `demo@guardiantrading.com`

---

## Guardian Trading Onboarding

Multi-step onboarding platform at `/` (guardian-trading artifact).

### Features
- 11 sequential steps with state machine enforcement
- URL-bypass prevention via `OnboardingGuard`
- Backend step validation with persistent session restoration
- Field-level audit logging on all step saves
- `useOnboardingStep(N)` unified controller hook with retry queue

### Step Numbering
- 0: GeneralDetails (no progress bar)
- 1–11: Personal → Professional → ID Info → Income → Risk → Financial → Experience → ID Upload → Funding → Disclosures → Signatures

### Location System (Global)
- Country → State → City cascading `SearchableSelect` dropdowns (type-to-filter, no native `<select>`)
- `locationService.ts` in `src/lib/location/` — ~195 countries (alphabetically sorted), states/provinces for 50+ countries, cities for all mapped states
- `getStateLabel(countryCode)` returns context-aware label (State/Province/Canton/Prefecture/Bundesland/Estado)
- City falls back to text input when no dropdown data exists for a region
- Used on: PersonalDetails (Step 1), ProfessionalDetails (Step 2), IdInformation (Step 3), Settings
- Architecture: all data in `locationService.ts` — ready for Google Places API swap without form changes
- Initial mount protection via `useRef` — saved data preserved when revisiting steps

### Date Auto-Format (MM/DD/YYYY)
- `useDateMask` hook in `src/lib/useDateMask.ts` — auto-inserts "/" at positions 2 and 4
- `MaskedDateInput` component wraps the hook with calendar icon
- Applied to: IdInformation (Date of Birth, Issue Date, Expiration Date)
- Handles backspace at slash boundaries correctly

### PersonalDetails (Step 1)
- Country-aware ZIP/postal code validation

### Validation
- `src/lib/validation.ts` — shared validators: name, email, phone, ZIP (country-aware), date, DOB (exact age calc), SSN/EIN, address, ABA/SWIFT, account number, deposit amount, ID expiration
- All 12 step components have strict real-time field-level validation with error messages
- Backend `signup.ts` has matching format validation: phone regex, SSN/EIN format, date parsing, ABA/SWIFT format, name character checks, conditional employer fields, investment experience rows, disclosure questions, signature consents

### Dashboard UI Design System
Production-grade dark fintech dashboard (Robinhood/SoFi quality). Default theme is dark.

#### Color Palette (Dark Theme)
- Background: `#060b14`, Sidebar: `#0a1122`, Cards: `#0d1526`
- Accent: `#3b82f6` (blue), Green: `#0ecb81`, Red: `#f6465d`, Yellow: `#f0b90b`, Purple: `#a78bfa`
- Text: Primary `#e2e8f0`, Sub `#94a3b8`, Muted `#4a5568`
- Borders: `#141f35` / `#161f35` / `#1e293b`

#### ThemeContext (`src/context/ThemeContext.tsx`)
- Extended color interface with 45+ tokens (sidebar, topBar, card, green/red/yellow/purple + Bg variants, scrollbar)
- Light theme also available via toggle

#### DashboardLayout
- **Desktop**: 240px sidebar with gradient logo, nav items (active = blue highlight with dot indicator), verified badge, hover-to-red logout
- **Market Ticker Bar**: Auto-scrolling live prices for 10 symbols (AAPL, TSLA, NVDA, AMD, MSFT, META, AMZN, GOOG, SPY, QQQ) with green/red change indicators, updates every 3s
- **Top Bar**: Search input, theme toggle (sun/moon icon button), notification bell with red badge, user avatar with gradient background + "Pro Account" label
- **Mobile**: Bottom nav bar with 6 tabs, no sidebar, safe-area padding

#### Page Designs
- **Overview**: 4 stat cards (gradient icon badges), Portfolio Performance area chart (1D/1W/1M/1Y tabs, LIVE indicator), Asset Allocation (horizontal stacked bar + list), Recent Trades table/cards, right sidebar with equity, credit card, Quick Transfer
- **Positions**: 3 stat cards, search + Long/Short filter + refresh, responsive data table with color-coded side badges
- **Orders**: Tab filter (All/Active/Pending/Filled/Cancelled with counts), New Order modal (blur backdrop, gradient icon, buy/sell toggle), search
- **Portfolio**: Live multi-ticker chart (AAPL/TSLA/NVDA/AMD selector, pause/resume), donut allocation chart, holdings table
- **Statements**: Credits/Debits/Balance summary, type filter tabs, CSV download, transaction table
- **Settings**: Profile card with gradient avatar, Profile/Security/Notifications sections, password strength meter, 2FA toggle

### Responsive Design (Mobile-First)
All dashboard pages are fully responsive with mobile-first breakpoints (optimized for iPhone 16 Pro Max / 430px):
- **DashboardLayout** — Desktop sidebar (240px, hidden on mobile), bottom navigation bar on mobile (`md:` breakpoint), no hamburger/drawer
- **Overview** — Stat cards stack on mobile (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`), right aside panel hidden on mobile (`hidden xl:flex`), mobile card view for trades table
- **Positions/Orders/Statements** — Mobile card views for data (`hidden sm:block` table / `block sm:hidden` cards), responsive summary grids, horizontally scrollable filter tabs
- **Portfolio** — 2-col mobile / 4-col desktop summary cards, chart + allocation stack on mobile (`flex-col lg:flex-row`), mobile card view for holdings
- **Settings** — Horizontal scrollable section tabs on mobile, stacked form layout, avatar hidden on mobile
- **OnboardingShell** — Horizontally scrollable 11-step progress bar (`overflow-x-auto` with `min-width: 600px`), responsive footer padding
- Tables use `overflow-x-auto` with `min-width` for horizontal scroll on constrained viewports

### KYC Flow Gate
- `Login.tsx` checks `/api/user/me` after auth — routes to correct onboarding step, `/application-pending`, or `/dashboard` based on KYC status
- `DashboardLayout.tsx` checks user status on mount — non-approved users redirected; fetch failure redirects to `/login` (no bypass)
- Statuses: `approved` → dashboard, `pending`/`verified` → onboarding or pending page, `rejected` → error message, `resubmit` → restart onboarding, `not_found`/unknown → onboarding

### Notifications System
- `GET /api/notifications?email=` — returns notifications array + unread count
- `POST /api/notifications/read` — marks all as read (body: `{ email }`)
- Auto-generated on KYC admin actions (approve/reject/resubmit)
- `Notifications.tsx` page with unread badges, mark-read, type-colored cards
- Bell icon in DashboardLayout with real unread count (30s polling)

### Crypto Market Data
- `GET /api/market/prices` — CoinGecko proxy for BTC, ETH, BNB, SOL, XRP, ADA, DOGE, DOT, AVAX, MATIC (60s server-side cache)
- `GET /api/market/chart/:coinId` — OHLC chart data with timeframe parameter
- `Markets.tsx` page with live prices table, sparklines, OHLC chart with 1D/7D/30D/90D/1Y selectors

### Profile Picture Upload
- `POST /api/user/profile-picture` — multipart upload (max 5MB, jpg/png/webp)
- `GET /api/user/profile-picture/:filename` — serves image
- `DELETE /api/user/profile-picture?email=` — removes image
- `GET /api/user/me?email=` — returns user status, KYC completion, completed steps, profile picture filename
- Settings.tsx shows upload button on avatar, preview, remove option
- DashboardLayout shows profile pic in top bar if set

### Key Files (guardian-trading)
- `src/lib/onboarding/OnboardingContext.tsx` — state machine + session restore
- `src/lib/onboarding/useOnboardingStep.ts` — unified controller hook
- `src/lib/onboarding/OnboardingGuard.tsx` — route guard
- `src/lib/location/locationService.ts` — cascading location data
- `src/lib/onboarding/schema.ts` — Zod schemas for all 11 steps
- `src/pages/dashboard/Markets.tsx` — crypto market data page
- `src/pages/dashboard/Notifications.tsx` — notifications page
- `src/pages/dashboard/Settings.tsx` — settings with profile picture upload

---

## Admin KYC Dashboard

Separate web artifact at `/admin-kyc/`. JWT Bearer token authentication (8h session). Auto-polling every 15 seconds for real-time user detection (refetchInterval: 15_000, refetchOnWindowFocus: true).

### Views (5 total)
1. **KYC Queue** — Sortable table of all applicants with risk score, status badges, side panel with profile/risk/audit tabs and approve/reject/resubmit actions
2. **Users** — Full user registry with search, status/role filters, sortable columns, per-row quick actions (suspend/ban/reactivate), "New User" modal, "View" → User Profile navigation
3. **Risk Events** — Live fraud/risk flag monitor across all users
4. **Activity Logs** — Global audit log with search, action-type filter, "View User →" button to open profile
5. **Audit Log** — Timeline view of all admin actions with expand-for-detail cards

### User Profile View
Full-page detail accessed by clicking any user (from Users or Activity Logs). Tabs:
- **Profile** — All KYC sections (Personal, Identity, Financial, Banking, Account, Trusted Contacts) with inline edit for name
- **Risk** — Risk score gauge + flagged rules
- **Audit** — Per-user audit timeline with color-coded action types
- **Balance** — Current balance display + Set Balance form + balance history
- **Admin Actions** — Full control panel: approve/reject/resubmit (status-aware `KycDecisionBtn` with active highlight, checkmark, disabled state, "Decision recorded" banner), suspend/ban/reactivate, assign role, reset password, flag user, delete account (with confirmation). Reject requires non-empty reason (client + server validated). Both `UserPanel.tsx` (KYC Queue sidebar) and `UserProfileView.tsx` (Actions tab) share consistent KYC button behavior.

### Backend Admin Routes (api-server)
- `GET  /api/admin/kyc-queue` — paginated user list, sorted by risk score
- `GET  /api/admin/all-users` — all users with role, balance, last activity (searchable/filterable)
- `GET  /api/admin/user-details/:email` — full profile + risk + audit log (merges master data into profile for completeness)
- `GET  /api/admin/user-balance/:email` — current balance + history
- `GET  /api/admin/user-documents/:email` — lists uploaded documents with availability status
- `GET  /api/admin/user-document-file/:email/:role` — serves document file (path-traversal protected)
- `GET  /api/admin/global-audit` — all admin actions across all users
- `POST /api/admin/approve-user` — KYC approval
- `POST /api/admin/reject-user` — KYC rejection with reason
- `POST /api/admin/request-resubmission` — request KYC resubmission
- `POST /api/admin/suspend-user` — suspend account
- `POST /api/admin/ban-user` — ban account with reason
- `POST /api/admin/reactivate-user` — restore account
- `POST /api/admin/assign-role` — set user role (user/vip/restricted/admin)
- `POST /api/admin/set-balance` — set balance + profit with history
- `POST /api/admin/flag-user` — flag user with reason
- `POST /api/admin/reset-password` — clear password hash (force reset)
- `POST /api/admin/create-user` — admin-initiated user creation
- `POST /api/admin/update-user` — update name fields
- `DELETE /api/admin/delete-user` — permanent deletion
- All routes: JWT Bearer auth (header only, no query-string tokens), rate-limited 120 req/min, login rate-limited 5/15min per IP
- Document viewing: frontend fetches via Authorization header → blob URL (no token leakage in URLs)

### Fraud Detection Engine (`src/lib/fraud/riskEngine.ts`)
- 9 fraud rules: DOB mismatch, incomplete steps, phone reuse, rapid submission, margin+max-risk combo, missing address, high risk tolerance, upload without ID profile, internal IP flag
- Score 0–100 → level: low / medium / high / critical
- `POST /api/fraud/risk-score` — evaluate and cache score for a user
- `GET  /api/fraud/risk-events` — list all risk evaluations across users

---

## AI Trading Assistant

Floating chat widget on all dashboard pages, powered by an AI service abstraction layer.

### Architecture
- **Frontend**: `AiAssistant.tsx` — floating chat widget in bottom-left of dashboard with open/minimized/expanded states, streaming SSE message display, quick prompts, auto-trading toggle with disclaimer modal
- **Backend**: AI service abstraction layer with provider auto-selection
  - `src/lib/ai/aiService.ts` — `AiProvider` interface with Grok (xAI) and OpenAI implementations using OpenAI SDK
  - `src/lib/ai/tradingContext.ts` — builds system prompt with portfolio/market/staking context
  - `src/lib/ai/chatStore.ts` — file-based conversation history per user (`data/ai-chats/{email}.json`)
  - `src/routes/ai/index.ts` — SSE streaming chat, history, clear, portfolio, market, staking, provider endpoints

### AI Provider Priority
1. **Grok (xAI)**: Set `XAI_API_KEY` or `GROK_API_KEY` env var → uses `https://api.x.ai/v1` with `grok-3` model
2. **OpenAI (Replit integration)**: Falls back when no Grok key → uses `AI_INTEGRATIONS_OPENAI_BASE_URL` with `gpt-4o` model

### API Routes
- `POST /api/ai/chat` — SSE streaming chat (body: `{ message, email }`)
- `GET  /api/ai/history?email=` — conversation history
- `POST /api/ai/clear` — clear conversation (body: `{ email }`)
- `GET  /api/ai/portfolio` — portfolio data
- `GET  /api/ai/market` — market data
- `GET  /api/ai/staking` — staking data
- `GET  /api/ai/provider` — current AI provider name

### AI Security
- AI output sanitized with DOMPurify (allowlist: strong, em, code, br)
- Buffered SSE parser prevents partial-frame data loss
- AbortController for request cancellation on widget close
- Backend disconnect detection stops model streaming when client disconnects

### Platform Security (`src/middleware/security.ts`)
- **Security headers**: CSP (allows LiveChat `cdn.livechatinc.com`, `*.lc.chat`), X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, Cross-Origin-Opener-Policy, Cross-Origin-Resource-Policy, X-DNS-Prefetch-Control, X-Download-Options, X-Permitted-Cross-Domain-Policies
- **Global error handler**: Express catch-all error middleware in `app.ts` — logs stack traces and returns 500 JSON, prevents process crashes from unhandled errors
- **Bot detection**: Known bot/scraper user-agent blocking (50+ patterns), headless browser detection, suspicious behavior scoring with temporary IP bans
- **Error handling**: Every backend route handler (auth, profile, AI, signup, admin) wrapped in try/catch with structured error logging and 500 JSON responses — no unhandled exceptions can crash the server
- **Rate limiting**: Global 100 req/min, all auth endpoints (login/register/verify/reset) use sensitiveEndpointLimit 30 req/15min, admin login 5/15min per IP, anomaly detection (30 req/10s rapid-fire block)
- **CORS**: Restricted to guardiiantrading.com, Replit domains, and dev localhost (no wildcard in production)
- **Hotlink protection**: Referer-based blocking for media files (images, videos, PDFs)
- **Honeytrap routes**: Fake data export endpoints (`/api/v1/export`, `/api/users.json`, etc.) that log and auto-ban scrapers
- **robots.txt**: Disallows API, admin, dashboard, and private pages; blocks AI crawlers (GPTBot, CCBot, anthropic-ai, Google-Extended)
- **Frontend anti-scrape**: Right-click disabled, keyboard shortcuts blocked (Ctrl+U/S/P, F12, DevTools), image drag prevention
- **Profile picture safety**: Path traversal prevention via `path.basename()`, directory resolved via centralized `getDataDir()`

### Dependencies
- `openai` (api-server) — OpenAI SDK for both Grok and OpenAI providers
- `dompurify` (guardian-trading) — HTML sanitization for AI responses

---

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`

#### Auth Routes (`src/routes/auth.ts`)
- `POST /api/auth/send-verification` — sends email verification code
- `POST /api/auth/verify-code` — verifies the code
- `POST /api/auth/register` — registers a user (in-memory + persisted to disk via userDataStore)
- `POST /api/auth/login` — validates email/password, returns success

#### Signup Data Storage (`src/routes/signup.ts`, `src/lib/userDataStore.ts`)
- `POST /api/signup/save-step` — saves a named form step for a user; body: `{ email, step, data }`
- `GET /api/signup/get-progress?email=` — returns completed steps and step data for a user
- Data is stored in `data/users/{sanitizeEmail}/profile.json` (per-user) and `data/users.json` (master index)
- **Data directory resolution**: `userDataStore.ts` auto-detects the correct data path — uses `CWD/data/` in dev (CWD=api-server/) and `CWD/artifacts/api-server/data/` in prod (CWD=workspace root). Override with `USER_DATA_DIR` env var. Admin routes use the same `readMaster()` from userDataStore (no duplicate file readers).
- New users get `status: "pending"` on creation in both master and profile
- Sensitive fields are AES-256-GCM encrypted before storage: `taxId`, `idNumber`, `dateOfBirth`, `password`, `passwordHash`, `foreignIdType`
- Encryption key is read from env var `USER_DATA_KEY` (falls back to dev key with a warning)
- All save-step calls are audit-logged: `[Audit][timestamp] action=SAVE_STEP step=X email=Y`
- Steps saved: `general`, `personal`, `professional`, `idInformation`, `income`, `riskTolerance`, `financialSituation`, `investmentExperience`, `idProofUpload`, `fundingDetails`, `disclosures`, `signatures`
- **Data integrity**: Atomic file writes (write-to-temp-then-rename), corrupt file backup on parse failure, empty file guard
- **Password hashing**: Uses `simpleHash` (consistent across auth.ts, profile.ts) — `hash * 31 + charCode >>> 0` to hex

#### User Settings Routes (`src/routes/profile.ts`)
- `POST /api/user/update-profile` — saves profile settings (firstName, lastName, phone, location)
- `POST /api/user/change-password` — validates current password, sets new (uses simpleHash matching auth.ts)
- `POST /api/user/update-notifications` — saves notification preferences
- Multer error middleware handles file size/type errors with structured JSON responses
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest
- In production, the API server also serves static files for guardian-trading (`/`) and admin-kyc (`/admin-kyc/`) with SPA fallbacks

## Deployment

- **Target**: Autoscale (Replit)
- **Build**: `bash scripts/build-production.sh` — builds shared libs, guardian-trading (BASE_PATH=/), admin-kyc (BASE_PATH=/admin-kyc/), and api-server
- **Run**: `node artifacts/api-server/dist/index.cjs` — single process serves API + both frontends
- **Static paths**: resolved via `process.cwd()` in `app.ts` (CJS-safe, no `import.meta.url`)
- **Route precedence**: `/api/*` → API routes, `/admin-kyc/*` → admin SPA, `/*` → guardian-trading SPA

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.
