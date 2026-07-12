# Memory Index

- [Guardian Trading architecture split](guardian-trading-architecture.md) — root `server/`+`client/`+`admin/` is the live/canonical dev code; `artifacts/*` is a stale duplicate still wired into production deploy.
- [.replit env block typo](replit-env-typo-checks.md) — a misspelled TOML table name silently drops secret/env config with no error; worth grepping for when env vars "aren't applying".
