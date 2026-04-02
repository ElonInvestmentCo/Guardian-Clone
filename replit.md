# Guardian Trading - Workspace

## Overview

Guardian Trading is a production-grade fintech platform designed to offer a comprehensive trading experience. It features a customer-facing trading application, an administrative KYC (Know Your Customer) portal, and a robust backend API server. The platform aims to provide a secure, efficient, and user-friendly environment for financial trading, incorporating advanced analytics, AI assistance, and stringent security measures.

The project's ambition is to deliver a high-quality, full-featured financial trading ecosystem with a focus on modern UI/UX, robust security, and scalable architecture.

## User Preferences

I prefer iterative development, with a focus on delivering functional components that can be reviewed and refined. I value clear and concise communication. Please ask for clarification if anything is unclear before proceeding with major changes. I appreciate detailed explanations for complex technical decisions.

## System Architecture

Guardian Trading is structured as a pnpm monorepo, utilizing Node.js 24 and TypeScript 5.9. The architecture comprises three main applications:

### UI/UX Decisions
- **Guardian Trading Frontend (Vite)**: Customer-facing trading app with a production-grade dark fintech dashboard aesthetic (inspired by Robinhood/SoFi). Features a comprehensive color palette, `ThemeContext` for managing themes (dark by default, light available), and a `DashboardLayout` for desktop (sidebar, market ticker, top bar) and mobile (bottom navigation). All pages are fully responsive with mobile-first breakpoints.
- **Admin KYC Dashboard (Vite)**: Separate web artifact with a "Safee Bootstrap Admin Template" aesthetic. It includes a dark sidebar, white header, and a consistent layout for various administrative views.
- **Onboarding Platform**: A multi-step onboarding process with state machine enforcement, URL-bypass prevention, backend validation, and field-level audit logging. It incorporates a global location system with cascading dropdowns and country-aware validation.

### Technical Implementations
- **Monorepo Tool**: pnpm workspaces manage the project's structure.
- **API Framework**: Express 5 is used for the backend API server.
- **Database**: PostgreSQL with Drizzle ORM for data persistence.
- **Validation**: Zod is used for API request/response validation and schema generation.
- **API Codegen**: Orval generates React Query hooks and Zod schemas from an OpenAPI specification.
- **Build System**: esbuild for CJS bundles.
- **TypeScript & Composite Projects**: Utilizes TypeScript's composite projects for efficient type-checking and dependency management across packages.
- **Signup Data Storage**: User data, including sensitive fields, is encrypted (AES-256-GCM) and stored securely on disk with atomic file writes and file locking to prevent race conditions.
- **KYC Flow Gate**: Integrates with the backend to manage user access based on KYC status, redirecting users to appropriate pages (onboarding, pending, dashboard).
- **Notifications System**: Features real-time notifications with polling for unread counts and type-colored cards.
- **AI Trading Assistant**: A floating chat widget in the dashboard with streaming SSE messages. The backend uses an AI service abstraction layer (`AiProvider` interface) supporting Grok (xAI) and OpenAI, building system prompts with portfolio/market/staking context.

### Feature Specifications
- **Analytics Platform**: A full SaaS analytics platform with multi-tenant projects, embeddable tracking scripts, event ingestion (with bot detection, visitor fingerprinting, session tracking), a dashboard with real-time visitors, KPI cards, time-series charts, campaign attribution, click heatmaps, and session replay.
- **Onboarding Steps**: 11 sequential steps covering personal, professional, ID, income, risk, financial, experience, ID upload, funding, disclosures, and signatures.
- **Date Auto-Format**: `useDateMask` hook for MM/DD/YYYY input formatting.
- **Dashboard Pages**: Detailed designs for Overview, Positions, Orders, Portfolio, Statements, and Settings, including dynamic charts, data tables, and user interaction elements.
- **Admin KYC Views**: Dashboard, KYC Queue (with side panel and mobile bottom-sheet), Users, Risk Events, Activity Logs, and Audit Log, each with Bootstrap-styled components and interactive elements.
- **User Profile View (Admin)**: Comprehensive user details with tabs for Profile, Risk, Audit, Balance, and Admin Actions (approve/reject/resubmit KYC, suspend/ban, assign roles, reset password, flag, delete).
- **Fraud Detection Engine**: A rule-based engine (`riskEngine.ts`) that scores users based on various fraud indicators (DOB mismatch, incomplete steps, phone reuse, etc.) and categorizes risk levels.
- **Crypto Market Data**: Integration to fetch live market prices and OHLC chart data for major cryptocurrencies.
- **Profile Picture Upload**: Secure multipart upload, serving, and deletion of user profile pictures.

### Admin Authentication
- **Credentials**: Admin login uses username `no-reply` and a bcrypt-hashed password stored in `artifacts/api-server/data/admin.json`.
- **Credential Priority**: Environment variables (`ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `ADMIN_JWT_SECRET`) take precedence over `data/admin.json`. For production, set these env vars and remove the JSON file.
- **Session**: JWT-based with configurable expiry, issued by `POST /api/admin/login`.
- **Rate Limiting**: IP-based login rate limiting with lockout after repeated failures.
- **Cache Behavior**: Credentials are cached in memory on server startup; API server must be restarted to pick up credential changes.

### User Status Flow
- **Status lifecycle**: `pending` → `approved` (admin manually approves via KYC dashboard) → dashboard access granted.
- **Intermediate states**: `verified` (under review, no dashboard access), `rejected`, `resubmit`.
- **Only `approved` grants dashboard access** — enforced in `DashboardLayout.tsx`, `Login.tsx`, and `ApplicationPending.tsx`.
- **No auto-approval**: The `complete-step` route never changes user status, even on final step completion.

### Email Validation & Forgot Password
- **Duplicate email detection**: Real-time debounced check on Signup page (`check-email` endpoint), plus server-side guard on `send-verification` (returns 409 for existing emails).
- **Email normalization**: All auth endpoints (`check-email`, `send-verification`, `register`, `login`, `send-reset-code`) normalize email via `trim().toLowerCase()`. `getUserData()` also performs case-insensitive lookup.
- **Forgot Password**: Full end-to-end flow — `POST /api/auth/send-reset-code` → Resend email with 6-digit code (10min expiry) → `POST /api/auth/reset-password` with code + new password. Frontend at `/forgot-password`.

### Deployment
- **Target**: Always-on VM (`deploymentTarget = "vm"`) for persistent file storage (user data, documents, profile pictures stored on disk).
- **Production routing**: Single Express server serves trading app at `/`, admin dashboard at `/admin-kyc/`, and API at `/api/`.

### Admin KYC Navigation
- **KYC Queue side panel** (UserPanel): Quick overview with Profile/Risk/Audit tabs and admin actions (approve/reject/resubmit). "Full Profile →" button navigates to the detailed UserProfileView.
- **Full Profile View**: All user data across 12+ sections, uploaded documents with secure "View" buttons (blob URLs), Balance management, and Admin Actions (suspend/ban/flag/delete/role assignment/password reset).

### Admin Balance & Profit Management
- **Transaction types**: 7 categorized types (deposit, withdrawal, adjustment, bonus, correction, fee, refund) with color-coded badges.
- **Required notes**: All balance/profit changes require an admin note explaining the reason. Backend returns 400 if note is missing.
- **Validation**: Negative balances blocked, numeric validation on all amounts.
- **Confirmation dialog**: Balance changes show a review step (current vs new values, type, reason) before applying. Admin must explicitly confirm.
- **Transaction history**: Full audit trail with color-coded entries showing previous values, change deltas (+/-), transaction type, timestamp, actor, and note.
- **Audit log filtering**: Search/filter input on the Audit tab to find entries by action type, actor, note, or metadata.
- **Action confirmation safeguards**: Sensitive operations (suspend, ban, role change, password reset, delete) all require explicit confirmation dialogs before executing.
- **Balance change audit metadata**: Each balance change records `transactionType`, `balanceChange`, and `profitChange` in both `_balanceHistory` and `_auditLog`.
- **KYC decision buttons**: Once a KYC decision (approve/reject/resubmit) is recorded, ALL three buttons become disabled, grayed out, and non-clickable in both the side panel and full profile view. A "Decision recorded" banner appears.
- **Sensitive field consolidation**: Admin user-details endpoint dynamically consolidates ID and funding fields from any step key into canonical `idInformation` and `fundingDetails` objects, ensuring fields are always displayed regardless of which onboarding step stored them.

### Data Lifecycle & Clean State
- **Email normalization**: All API endpoints (auth, signup, admin) normalize emails to `trim().toLowerCase()` before persistence, preventing case-variant duplicate entries.
- **Clean user initialization**: New registrations create minimal profiles — only `email`, `createdAt`, `updatedAt`, `status: "pending"`, and encrypted `credentials`. No default balances, histories, or audit logs.
- **Empty state messaging**: Both trading dashboard and admin dashboard display professional "No data yet" messages with appropriate icons and actionable guidance when data is empty.
- **Data-only-on-action**: Balance, history, and audit log entries are only created when real actions occur (admin balance changes, onboarding step completions, KYC decisions).

### Platform Security
- **Security Headers**: Comprehensive set of security headers to mitigate common web vulnerabilities.
- **Global Error Handler**: Centralized error handling for Express to log errors and return consistent 500 JSON responses.
- **Bot Detection**: Blocking known bot user-agents and detecting headless browsers and suspicious behavior.
- **Rate Limiting**: Configurable rate limits across various endpoints (global, auth, admin, AI chat, file uploads).
- **CORS**: Strictly restricted CORS policies.
- **Hotlink Protection**: Referer-based blocking for media files.
- **Honeytrap Routes**: Decoy endpoints to detect and ban scrapers.
- **Robots.txt**: Disallows sensitive pages and blocks AI crawlers.
- **Frontend Anti-scrape**: Disables right-click, blocks keyboard shortcuts, and prevents image dragging.
- **Path Traversal Protection**: `assertSafePath()` guard in `userDataStore.ts` validates all user-derived file paths against base directory. `chatStore.ts` and `profile.ts` use `path.resolve` + `startsWith` checks. All filesystem operations use resolved absolute paths.
- **Profile Picture Safety**: Path traversal prevention for uploaded files using `path.basename` + resolved path validation.
- **Dependency Overrides**: lodash forced to `>=4.17.21` via pnpm overrides to address known CVEs.
- **Field-Level Encryption**: Sensitive fields (taxId, ssn, idNumber, dateOfBirth, foreignIdType, accountNumber, abaSwift, bankAccountNumber, routingNumber) are encrypted at rest with AES-256-GCM. Key derived from `USER_DATA_KEY` env var via scrypt. Admin dashboard decrypts server-side in the authenticated `user-details` endpoint only — raw encrypted values never reach the frontend. `decryptSensitiveProfile()` recursively walks all nested objects/arrays and replaces any undecryptable `enc:` values with `[decryption failed]`.

### Admin Dashboard Header
- **Profile Avatar ("A")**: 40x40px button with gradient background, hover glow, focus-visible outline, and active scale effect.
- **Profile Dropdown**: Opens on click, closes on outside click. Shows admin info and Sign Out button. Animated fade-in. z-index 1050.
- **Responsive Header**: Search bar hidden on mobile (<992px). Tighter padding on tablet/mobile. Title font scales down on small screens (<576px). All header elements use flexbox with `flex-shrink: 0` to prevent overlap.

## External Dependencies

- **PostgreSQL**: Primary database for all application data.
- **Drizzle ORM**: Used for database interactions with PostgreSQL.
- **CoinGecko API**: Proxied for fetching cryptocurrency market data (prices, OHLC charts).
- **OpenAI SDK**: Used for AI assistant functionalities, supporting both Grok (xAI) and OpenAI providers.
- **DOMPurify**: Frontend library for sanitizing AI responses.
- **LiveChat**: Integrated for customer support, requiring specific CSP allowances.
- **bcrypt**: For secure password hashing.
- **Multer**: For handling multipart form data, specifically profile picture uploads.