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
- **Data Storage**: User data (including sensitive fields) is AES-256-GCM encrypted and stored in PostgreSQL JSONB columns. Document files are stored as BYTEA.
- **KYC Flow Gate**: Manages user access based on KYC status, redirecting users through onboarding, pending, or dashboard views.
- **Notifications System**: Real-time notifications with polling for unread counts.
- **AI Trading Assistant**: A floating chat widget with streaming SSE messages, using an `AiProvider` abstraction layer for Grok (xAI) and OpenAI, building prompts with contextual data.
- **Admin Authentication**: JWT-based session, IP-based rate limiting, and bcrypt-hashed credentials (from env vars or `admin.json`).
- **KYC Lifecycle**: User status transitions from `pending` to `verified`, `approved`, `rejected`, or `resubmit_required`, with route guards enforcing access based on status. Resubmission allows users to correct specific fields requested by admin.
- **Email & Password Management**: Real-time duplicate email detection, email normalization, and a complete forgot password flow with timed reset codes.
- **Deployment**: Railway.com for backend/admin and Netlify for frontend. Single Express server serves all applications.
- **Admin Features**: KYC Queue with side panel, detailed User Profile View (Profile, Risk, Audit, Balance, Admin Actions), and comprehensive balance/profit management with transaction types, required notes, validation, confirmation dialogs, and full audit trails.
- **Data Integrity**: Email normalization, minimal user initialization, empty state messaging, and data-only-on-action for balance/history/audit logs.

### Platform Security
- **Web Security**: Comprehensive security headers, global error handling, bot detection, rate limiting, strict CORS, hotlink protection, honeytrap routes, and `robots.txt`.
- **Frontend Anti-scrape**: Comprehensive protection on all pages — blocks right-click context menu, disables all text selection (except form inputs), blocks copy/cut/paste outside editable fields, prevents image/video dragging, blocks keyboard shortcuts (Ctrl+U/S/P/A/C/X, F12, DevTools, PrintScreen), hides content on print (@media print), MutationObserver marks all dynamically-loaded images as non-draggable, and HTML body-level event handlers as fallback. Form inputs/textareas remain fully usable.
- **Path Traversal Protection**: `assertSafePath()`, `path.resolve`, and `startsWith` checks for all user-derived file paths and uploads.
- **Dependency Management**: pnpm overrides to address CVEs (e.g., `lodash`).
- **Field-Level Encryption**: Sensitive user fields are encrypted at rest (AES-256-GCM) with server-side decryption only for authenticated admin access.

## External Dependencies

- **PostgreSQL**: Primary database.
- **Drizzle ORM**: Database interactions.
- **CoinGecko API**: Cryptocurrency market data.
- **OpenAI SDK**: AI assistant functionality (supporting Grok and OpenAI).
- **DOMPurify**: Frontend AI response sanitization.
- **LiveChat**: Customer support integration.
- **bcrypt**: Password hashing.
- **Multer**: Multipart form data handling.