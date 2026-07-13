---
name: Vite client env var bridging for non-VITE_ secrets
description: How this repo exposes secrets to the Vite client build when the secret name isn't prefixed with VITE_
---

Vite only auto-exposes `import.meta.env.*` vars whose name starts with `VITE_`. Replit secrets are
often named without that prefix (e.g. `TURNSTILE_SITE_KEY`), especially when the value itself isn't
sensitive but the secret was set up before the client's expected var name was known.

**Why:** requesting a secret named to match a business/service concept (e.g. `TURNSTILE_SITE_KEY`)
is more natural than requiring the user or agent to know Vite's `VITE_` convention up front, and
renaming an already-set secret isn't possible — so the bridge lives in build config instead.

**How to apply:** in `vite.config.ts`, add a `define` block that maps the client-expected
`import.meta.env.VITE_X` key to `JSON.stringify(process.env.X ?? "")`. Restart the Vite workflow
after editing `vite.config.ts` — env var changes and `define` changes are not picked up by HMR.
