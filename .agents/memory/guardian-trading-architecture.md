---
name: Guardian Trading architecture split
description: Which codebase is canonical for dev vs. what production deploy actually builds/runs in this project.
---

Root `server/` (Express API, :3001), `client/` (Vite, :5000), `admin/` (Vite, :8080) is the
actively developed, feature-complete codebase — confirmed via diff to have newer features
(socket server, AI alert engine, `requireUser` middleware, Turnstile) that `artifacts/*` lacks.

`artifacts/api-server`, `artifacts/guardian-trading`, `artifacts/admin-kyc` are an older,
stale duplicate. `scripts/dev-start.sh` documents this as an intentionally "locked" setup for
*dev preview only* — only the three named root workflows (API Server, Guardian Trading, Admin KYC)
should be used for dev; the artifacts-managed workflows are meant to stay disabled no-ops.

**Why this matters:** the real production host for this project is Railway (`guardiiantrading.com`,
not Replit's own Deployments), and its Railway service (`guardian-trading-api` in project
`nurturing-vision`) was configured with `buildCommand`/`startCommand` targeting the
`@workspace/api-server` pnpm filter — i.e. the stale `artifacts/api-server` tree — while the root
app has all current features (StockTicker, Turnstile, auth fixes). This caused prod to look like a
months-old build even though `master` on GitHub was current and Railway had deployed that exact
commit; the *commit* was right but the *build/start commands* pointed at the wrong workspace, so
`.replit`'s own `[deployment]` block pointing at `artifacts/*` was a red herring for this symptom.
**Fixed**: Railway service's `buildCommand`/`startCommand` were changed (via Railway's GraphQL API,
`backboard.railway.com/graphql/v2`, using a personal `RAILWAY_TOKEN` as a Bearer token — note the
CLI's `RAILWAY_TOKEN` env var expects a *project* token and errors "Project Token not found" on a
personal account token, but the GraphQL API accepts it fine) to `pnpm install && pnpm run build`
/ `pnpm run start` (root scripts), then redeployed via `serviceInstanceRedeploy`.

**How to apply:** Before touching deployment config or claiming "the app is ready to deploy,"
check what a project's *actual* production host runs — for Railway, query
`project.services.serviceInstances.source`/`buildCommand`/`startCommand` via the GraphQL API rather
than assuming `.replit`'s `[deployment]` block is authoritative. A deployed commit hash matching
`master` does NOT mean the right code is running if the build/start commands target a stale
workspace filter.
