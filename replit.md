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

### PersonalDetails (Step 1)
- Country → State → City cascading dropdowns (pure `useState`, no react-hook-form)
- `locationService.ts` in `src/lib/location/` — 15 countries, 50 US states + city data, Canada provinces, UK regions, AU territories, EU regions, India states
- City falls back to text input when no dropdown data exists for a region

### Key Files (guardian-trading)
- `src/lib/onboarding/OnboardingContext.tsx` — state machine + session restore
- `src/lib/onboarding/useOnboardingStep.ts` — unified controller hook
- `src/lib/onboarding/OnboardingGuard.tsx` — route guard
- `src/lib/location/locationService.ts` — cascading location data
- `src/lib/onboarding/schema.ts` — Zod schemas for all 11 steps

---

## Admin KYC Dashboard

Separate web artifact at `/admin-kyc/`.

### Features
- **KYC Review Queue** — sortable table of all applicants with risk score + status badges
- **User Detail Side Panel** — full profile, risk flags, audit trail on row click
- **Approve / Reject / Request Resubmission** actions with admin note field
- **Admin Key authentication** — stores key in localStorage, protected by `X-Admin-Key` header
- **Risk score visualization** — score gauge with severity flags list
- **Audit timeline** — chronological log of all admin actions per user

### Backend Admin Routes (api-server)
- `GET  /api/admin/kyc-queue` — paginated user list, sorted by risk score
- `GET  /api/admin/user-details/:email` — full profile + risk + audit log
- `POST /api/admin/approve-user` — sets status=approved, appends audit entry
- `POST /api/admin/reject-user` — sets status=rejected, appends reason + audit entry
- `POST /api/admin/request-resubmission` — sets status=resubmit
- All routes: rate-limited 60 req/min, protected by `ADMIN_SECRET` env var

### Fraud Detection Engine (`src/lib/fraud/riskEngine.ts`)
- 9 fraud rules: DOB mismatch, incomplete steps, phone reuse, rapid submission, margin+max-risk combo, missing address, high risk tolerance, upload without ID profile, internal IP flag
- Score 0–100 → level: low / medium / high / critical
- `POST /api/fraud/risk-score` — evaluate and cache score for a user
- `GET  /api/fraud/risk-events` — list all risk evaluations across users

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
- `POST /api/auth/register` — registers a user (in-memory)
- `POST /api/auth/login` — validates email/password, returns success

#### Signup Data Storage (`src/routes/signup.ts`, `src/lib/userDataStore.ts`)
- `POST /api/signup/save-step` — saves a named form step for a user; body: `{ email, step, data }`
- `GET /api/signup/get-progress?email=` — returns completed steps and step data for a user
- Data is stored in `data/users/{sanitizeEmail}/profile.json` and `data/users.json`
- Sensitive fields are AES-256-GCM encrypted before storage: `taxId`, `idNumber`, `dateOfBirth`, `password`, `passwordHash`, `foreignIdType`
- Encryption key is read from env var `USER_DATA_KEY` (falls back to dev key with a warning)
- All save-step calls are audit-logged: `[Audit][timestamp] action=SAVE_STEP step=X email=Y`
- Steps saved: `general`, `personal`, `professional`, `idInformation`, `income`, `riskTolerance`, `financialSituation`, `investmentExperience`, `idProofUpload`, `fundingDetails`, `disclosures`, `signatures`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

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
