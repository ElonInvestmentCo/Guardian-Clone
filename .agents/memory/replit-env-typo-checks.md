---
name: .replit env block typo silently drops config
description: A misspelled TOML table name in .replit can silently make an entire env-var block a no-op with no error.
---

Found `[uservenv.shared]` (should be `[userenv.shared]`) in this project's `.replit`. Because the
table name was misspelled, Replit's env loader never applied it — every var inside (several
placeholder API keys) was silently absent from the actual shell environment, even though it
looked configured when reading the file.

**Why this matters:** this class of bug is invisible unless you actually diff the vars a running
process sees (`printenv` / `viewEnvVars`) against what `.replit` appears to declare. Placeholder-
looking values in `.replit` are also a smell — real secrets belong in Replit Secrets, not literal
strings in a config table.

**How to apply:** when an env var "isn't taking effect" and it's declared in `.replit`, check the
exact table name (`[userenv.shared]` / `[userenv.development]` / `[userenv.production]` are the
valid ones) before assuming the app code is misreading it.
