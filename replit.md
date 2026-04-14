# Guardian Trading - Workspace

## Overview

Guardian Trading is a production-grade fintech platform comprising a customer-facing trading application, an administrative KYC portal, and a robust backend API server. The platform aims to deliver a secure, efficient, and user-friendly environment for financial trading, incorporating advanced analytics, AI assistance, and stringent security measures. The project's ambition is to create a high-quality, full-featured financial trading ecosystem with a focus on modern UI/UX, robust security, and scalable architecture.

## User Preferences

I prefer iterative development, with a focus on delivering functional components that can be reviewed and refined. I value clear and concise communication. Please ask for clarification if anything is unclear before proceeding with major changes. I appreciate detailed explanations for complex technical decisions.

## System Architecture

Guardian Trading is structured as a pnpm monorepo using Node.js 24 and TypeScript 5.9, consisting of three main applications.

### UI/UX Decisions
- **Guardian Trading Frontend (Vite)**: Customer-facing app with a dark fintech dashboard aesthetic, featuring a comprehensive color palette, `ThemeContext` (dark default), and a responsive `DashboardLayout` for desktop and mobile.
- **Admin KYC Dashboard (Vite)**: Separate web application with a "Safee Bootstrap Admin Template" aesthetic, including a dark sidebar and consistent layout.
- **Onboarding Platform**: A multi-step process with state machine enforcement, URL-bypass prevention, backend validation, field-level audit logging, and a global location system with country-aware validation.

### Technical Implementations
- **Monorepo & Build**: pnpm workspaces, esbuild for CJS bundles, and TypeScript composite projects.
- **Backend & Database**: Express 5 API server, PostgreSQL (Railway-hosted) accessed via Drizzle ORM, with JSONB columns for users, profiles, chat, and BYTEA for document storage.
- **Validation & API Generation**: Zod for schema validation; Orval generates React Query hooks and Zod schemas from OpenAPI.
- **Data Storage**: User data (including sensitive fields) is AES-256-GCM encrypted and stored in PostgreSQL JSONB columns. Document files are stored as BYTEA. Data directory is persistent (`process.cwd()/data`), not `/tmp`.
- **KYC Flow Gate**: Manages user access based on KYC status, redirecting users through onboarding, pending, or dashboard views.
- **Notifications System**: Real-time notifications with polling for unread counts.
- **AI Trading Assistant**: A floating chat widget with streaming SSE messages, using an `AiProvider` abstraction layer for Grok (xAI) and OpenAI, building prompts with contextual data.
- **Admin Authentication**: JWT-based session, IP-based rate limiting, and bcrypt-hashed credentials (from env vars or `admin.json`). In development, a missing `ADMIN_JWT_SECRET` is generated once into `data/admin.jwt-secret`; production still requires `ADMIN_JWT_SECRET` as a secret.
- **KYC Lifecycle**: User status transitions from `pending` to `verified`, `approved`, `rejected`, or `resubmit_required`, with route guards enforcing access based on status. Resubmission allows users to correct specific fields requested by admin.
- **Email & Password Management**: Real-time duplicate email detection, email normalization, and a complete forgot password flow with timed reset codes.
- **Deployment**: External production uses Render for the Express API server and Vercel for the Vite frontend(s). Render builds only `@workspace/api-server`, exposes API routes under `/api`, and uses `/api/healthz` for health checks. Vercel builds the customer frontend from `artifacts/guardian-trading`; Vercel projects must set `VITE_API_URL` to the Render API domain, such as `https://api.guardiiantrading.com`.
- **Admin Features**: KYC Queue with side panel, detailed User Profile View (Profile, Risk, Audit, Balance, Admin Actions), and comprehensive balance/profit management with transaction types, required notes, validation, confirmation dialogs, and full audit trails. Profile fields mapped to actual onboarding schema (disclosures q1–q10, signatures consents map, professional aptSuiteNo/state). Boolean/yes-no values formatted as "Yes"/"No". Audit log entries are fully decrypted before being sent to the admin client. User role field included in user-details response. Global audit log decrypted before response.
- **Data Integrity**: Email normalization, minimal user initialization, empty state messaging, and data-only-on-action for balance/history/audit logs.

### Platform Security
- **Web Security**: Comprehensive security headers (CSP, X-Content-Type-Options, X-Frame-Options, HSTS via proxy, Referrer-Policy, Permissions-Policy), global error handling, bot detection (60+ patterns), rate limiting on ALL routes, strict CORS, hotlink protection, honeytrap routes, and `robots.txt` (30+ AI/SEO bots blocked).
- **CORS**: Production-locked — only allows explicit origins including `guardiiantrading.com`, `www.guardiiantrading.com`, `api.guardiiantrading.com`, and configured Vercel frontend domains. No wildcard matching. Dev mode adds exact REPLIT_DEV_DOMAIN + localhost ports only. CORS rejections logged with origin info. Frontend/admin use `VITE_API_URL` in Vercel builds to call the Render API. Bot detection middleware is disabled in non-production mode.
- **Admin Authentication**: JWT-based (8h TTL, `guardian-admin` issuer), bcrypt password hashing, timing-attack protection (dummy hash on wrong username), login rate limiting (5 attempts/15 min), and auto-logout on token expiry. All `/admin/*` routes (except login) protected by `requireAdmin` JWT middleware.
- **Frontend Anti-scrape**: Comprehensive protection on all pages — blocks right-click, text selection (except form inputs), copy/cut/paste outside editable fields, image/video dragging, keyboard shortcuts (Ctrl+U/S/P/A/C/X, F12, DevTools, PrintScreen), print (@media print + beforeprint handler), and MutationObserver for dynamic images. Admin dashboard allows text selection/copying when authenticated.
- **Rate Limiting**: Global (100/15min), auth/signup/contact (30/15min), admin (120/min), admin login (5/15min), uploads (30/15min), market data (30/min), AI chat (20/min), user data (60/min). Rate limit hits logged with IP and path.
- **Input Validation (Zod)**: All routes use Zod schema validation middleware (`validate()` in `src/lib/validation.ts`). Schemas enforce email format, field lengths, types, and patterns. GET/HEAD/DELETE validates `req.query`; POST/PUT/PATCH validates `req.body`. Validation failures return 400 with field-specific error messages and are logged with IP.
- **Sanitization**: `src/lib/sanitize.ts` provides `sanitizeText()` (strips all HTML tags via sanitize-html), `escapeHtml()`, and `sanitizeForEmail()` (double protection: sanitize + escape). Used for all user inputs rendered in HTML emails.
- **Security Logging**: Structured security event logger (`src/lib/securityLogger.ts`) records AUTH_FAIL, AUTH_SUCCESS, ADMIN_LOGIN_FAIL, ADMIN_LOGIN_SUCCESS, RATE_LIMIT, UPLOAD_REJECTED, CORS_REJECTED, BOT_BLOCKED, SUSPICIOUS_ACTIVITY, and HONEYTRAP events with IP, path, method, user-agent, and timestamp.
- **Security Headers**: HSTS (`max-age=31536000; includeSubDomains; preload`), CSP, X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy, X-DNS-Prefetch-Control, Cross-Origin-Opener-Policy, Cross-Origin-Resource-Policy. X-Powered-By header removed.
- **File Upload Security**: KYC documents (8MB max, JPG/PNG/PDF only, min 1KB), profile pictures (5MB max, JPG/PNG/WEBP only). Both validate MIME type + extension, use memory storage, and persist to PostgreSQL (not filesystem). Upload rejections logged via securityLogger.
- **Path Traversal Protection**: `assertSafePath()`, `path.resolve`, and `startsWith` checks for all user-derived file paths and uploads.
- **Dependency Management**: pnpm overrides to address CVEs (lodash `>=4.18.0`). Added `zod` and `sanitize-html` for backend validation/sanitization.
- **Field-Level Encryption**: Sensitive user fields encrypted at rest (AES-256-GCM), server-side decryption only for authenticated admin access. Credentials stripped from all API responses.
- **XSS Prevention**: All user inputs in HTML emails sanitized via `sanitizeForEmail()` (sanitize-html + escapeHtml). AI responses sanitized with DOMPurify on frontend.
- **Anti-bot Headers**: `X-Robots-Tag: noindex, nofollow, noarchive, noimageindex, nosnippet` on all API responses. `Cache-Control: no-store` prevents caching.

## External Dependencies

- **PostgreSQL**: Primary database.
- **Drizzle ORM**: Database interactions.
- **CoinGecko API**: Cryptocurrency market data.
- **OpenAI SDK**: AI assistant functionality (supporting Grok and OpenAI).
- **DOMPurify**: Frontend AI response sanitization.
- **LiveChat**: Customer support integration.
- **bcrypt**: Password hashing.
- **Multer**: Multipart form data handling.