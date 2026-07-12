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

**Why this matters:** `.replit`'s `[deployment]` block (`scripts/build-production.sh` + the
`run` command) builds and runs the stale `artifacts/api-server` tree, NOT the root code — so a
production deploy would ship an outdated app even though dev preview (root) is up to date and
correct. This mismatch was NOT fixed automatically (it's a real architectural decision — which
tree is canonical for prod — filed as a follow-up task instead of guessed at).

**How to apply:** Before touching deployment config or claiming "the app is ready to deploy,"
verify whether `[deployment]` still points at `artifacts/*`. If so, either resync artifacts/ from
root, or repoint the build/run to root — don't assume dev-preview parity means deploy parity.
