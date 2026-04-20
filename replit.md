# Guardian Trading

A comprehensive financial trading platform with KYC/AML compliance, an admin dashboard, and an AI-powered trading assistant.

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
- `API Server`: `PORT=3001 pnpm run dev:server`
- `Guardian Trading`: `pnpm --filter @workspace/guardian-trading run dev` on port 3000
- `Admin KYC`: `pnpm --filter @workspace/admin-kyc run dev` on port 8080

## Environment Variables
- `DATABASE_URL` — PostgreSQL connection string (auto-provided by Replit PostgreSQL module)
- `PORT` — Set per workflow (3001 for API, 3000 for client, 8080 for admin)
- `ADMIN_JWT_SECRET`, `ADMIN_SECRET`, `INTERNAL_API_KEY`, `USER_DATA_KEY` — Auth secrets (set in .replit userenv)
- `CMC_API_KEY` — CoinMarketCap API key
- `OPENAI_API_KEY` — For AI trading assistant features
- `RESEND_API_KEY` — For email communications

## Deployment
- Build: `scripts/build-production.sh`
- Run: `node artifacts/api-server/dist/index.cjs`
- The production server serves both frontend builds as static files
