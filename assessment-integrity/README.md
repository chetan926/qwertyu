# Assessment Integrity — Monorepo

> An AI-powered **Assessment Integrity** platform that ensures secure, fair, and transparent assessments. The monorepo contains two independent projects:
>
> | Project | Directory | Role |
> |---|---|---|
> | **Frontend** | `assessment-integrity/` | React + Vite SPA |
> | **Backend** | `assessment-integrity-backend/` | Express + Prisma REST API |

---

## Table of Contents

- [Overview](#overview)
- [Monorepo Structure](#monorepo-structure)
- [Frontend](#frontend)
  - [Tech Stack](#frontend-tech-stack)
  - [Directory Structure](#frontend-directory-structure)
  - [Environment Variables](#frontend-environment-variables)
  - [Getting Started](#frontend-getting-started)
- [Backend](#backend)
  - [Tech Stack](#backend-tech-stack)
  - [Directory Structure](#backend-directory-structure)
  - [Environment Variables](#backend-environment-variables)
  - [Getting Started](#backend-getting-started)
- [Database](#database)
- [Scripts Reference](#scripts-reference)

---

## Overview

Assessment Integrity is a platform designed to maintain the integrity of academic and professional assessments. It provides:

- **Secure Authentication** — Email/password sign-in, Google OAuth, OTP email verification, and password reset flows powered by `better-auth`.
- **Admin Panel** — A protected admin dashboard for managing users, viewing logs, and monitoring platform health.
- **Role-based Access** — Users are assigned roles (`user`, `admin`) with status management (active, suspended).
- **Audit Logging** — Every critical user action (login, register, logout, suspend, etc.) is tracked in `UserLog`.
- **Swagger API Docs** — Interactive API documentation exposed by the backend.

---

## Monorepo Structure

```
dev/                                  ← Git root (monorepo)
├── assessment-integrity/             ← Frontend (React + Vite)
└── assessment-integrity-backend/     ← Backend (Express + Prisma)
```

---

## Frontend

### Frontend Tech Stack

| Layer | Library / Tool | Version |
|---|---|---|
| Framework | React | 18.3.1 |
| Build Tool | Vite | ^8 (pinned 6.3.5) |
| Language | TypeScript / TSX | — |
| Routing | React Router v7 | ^7.18.0 |
| UI Components | Radix UI (full suite) | Various |
| Component Library | MUI (Material UI) | 7.3.5 |
| Animations | Motion (Framer Motion) | 12.x |
| Forms | React Hook Form | 7.x |
| Charts | Recharts | 2.x |
| Styling | Tailwind CSS v4 | 4.1.12 |
| Notifications | Sonner | 2.x |
| Icons | Lucide React | 0.487 |
| HTTP Client | Axios | ^1.7 |
| Auth (client) | better-auth client | via providers |
| Google One Tap | Custom `GoogleOneTap` component | — |
| Package Manager | pnpm | — |

### Frontend Directory Structure

```
assessment-integrity/
├── index.html                        ← HTML entry point
├── vite.config.ts                    ← Vite configuration
├── postcss.config.mjs                ← PostCSS / Tailwind setup
├── package.json
├── .env                              ← Environment variables (see below)
├── public/                           ← Static assets
├── guidelines/                       ← Internal dev guidelines / docs
└── src/
    ├── main.tsx                      ← App entry point (ReactDOM.render)
    ├── styles/                       ← Global CSS / Tailwind base styles
    ├── imports/
    │   └── LoginPortalIntegrityOs/   ← Shared import module (auth client setup)
    ├── admin/                        ← Admin-only views
    │   ├── AdminLoginView.tsx        ← Admin login page
    │   ├── AdminPanelView.tsx        ← Admin dashboard (user mgmt, logs)
    │   └── DemoDocsView.tsx          ← API / demo documentation view
    └── app/
        ├── App.tsx                   ← Root component & router config
        ├── components/               ← Reusable UI components
        │   ├── AiIllustration.tsx    ← Animated AI visual
        │   ├── CookieConsent.tsx     ← GDPR cookie banner
        │   ├── CountUp.tsx           ← Animated number counter
        │   ├── GoogleOneTap.tsx      ← Google One-Tap sign-in integration
        │   ├── figma/                ← Figma-exported components
        │   └── ui/                   ← Shadcn-style base UI primitives
        └── pages/
            ├── LandingView.tsx       ← Public landing / marketing page
            ├── DashboardView.tsx     ← Authenticated user dashboard
            ├── PrivacyPolicyView.tsx ← Privacy Policy page
            ├── TermsAndConditionsView.tsx ← Terms & Conditions page
            └── auth/                 ← All authentication pages
                ├── LoginView.tsx           ← Sign-in page
                ├── RegisterView.tsx        ← Sign-up page
                ├── ForgotPasswordEmailView.tsx ← Forgot password (step 1)
                ├── VerifyOTPView.tsx       ← OTP verification page
                ├── ResetPasswordView.tsx   ← Reset password (step 2)
                └── SecurityContext.tsx     ← Auth context / session state
```

### Frontend Environment Variables

Create a `.env` file in `assessment-integrity/`:

```env
# ──────────────────────────────────────────────────────────
# Google OAuth — Client ID for Google One Tap & OAuth flow
# Get this from: https://console.cloud.google.com/apis/credentials
# ──────────────────────────────────────────────────────────
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

> **Note:** All Vite environment variables must be prefixed with `VITE_` to be exposed to the browser bundle.

| Variable | Required | Description |
|---|---|---|
| `VITE_GOOGLE_CLIENT_ID` | ✅ Yes | Google OAuth 2.0 Client ID used for Google One Tap sign-in and OAuth login |

### Frontend Getting Started

```bash
cd assessment-integrity

# Install dependencies
pnpm install

# Start development server (http://localhost:5173)
pnpm dev

# Build for production
pnpm build
```

---

## Backend

### Backend Tech Stack

| Layer | Library / Tool | Version |
|---|---|---|
| Runtime | Node.js | — |
| Framework | Express | ^5.2 |
| Language | TypeScript | ^6.0 |
| ORM | Prisma | ^7.8 |
| Database Adapter | @prisma/adapter-pg | ^7.8 |
| Auth Library | better-auth | ^1.6 |
| Validation | Zod | ^4.4 |
| Mailer | Nodemailer | ^9.0 |
| API Docs | Swagger UI Express | ^5.0 |
| Linter / Formatter | Biome | ^2.4 |
| Dev Runner | tsx (watch mode) | ^4.22 |
| Package Manager | pnpm | 10.33.2 |

### Backend Directory Structure

```
assessment-integrity-backend/
├── prisma/
│   ├── schema.prisma             ← Database schema (PostgreSQL)
│   └── migrations/               ← Prisma migration history
├── src/
│   ├── server.ts                 ← HTTP server entry (starts Express)
│   ├── app.ts                    ← Express app setup (middleware, routes)
│   ├── scratch-check.ts          ← Temporary / debug script
│   ├── config/
│   │   └── env.ts                ← Typed environment variable loader (Zod-validated)
│   ├── constants/
│   │   └── http-status.ts        ← HTTP status code constants
│   ├── database/                 ← Prisma client instance / connection
│   ├── docs/                     ← Swagger/OpenAPI spec files
│   ├── middleware/
│   │   ├── error-handler.ts      ← Global Express error handler
│   │   └── not-found.ts          ← 404 handler
│   ├── providers/
│   │   └── auth.ts               ← better-auth provider configuration
│   ├── services/
│   │   └── mail.ts               ← Nodemailer email service
│   ├── types/                    ← Shared TypeScript type definitions
│   ├── utils/                    ← Utility / helper functions
│   ├── features/
│   │   ├── authentication/       ← Auth feature module
│   │   │   ├── controllers/      ← Route handlers
│   │   │   ├── routes/           ← Express routers
│   │   │   ├── schemas/          ← Zod validation schemas
│   │   │   ├── services/         ← Business logic
│   │   │   └── types/            ← Feature-specific types
│   │   └── health/               ← Health-check endpoint
│   └── admin/
│       ├── controllers/          ← Admin route handlers
│       ├── routes/               ← Admin Express routers
│       └── services/             ← Admin business logic
├── biome.json                    ← Biome lint/format config
├── tsconfig.json                 ← TypeScript compiler options
├── prisma.config.ts              ← Prisma config (adapter setup)
├── .npmrc
├── .env                          ← Environment variables (see below)
└── package.json
```

### Backend Environment Variables

Create a `.env` file in `assessment-integrity-backend/`:

```env
# ──────────────────────────────────────────────────────────
# Application
# ──────────────────────────────────────────────────────────
NODE_ENV=development           # Node environment: development | production | test
PORT=3000                      # Port the Express server listens on

# ──────────────────────────────────────────────────────────
# Database — PostgreSQL connection string for Prisma
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA
# ──────────────────────────────────────────────────────────
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/assessment_integrity?schema=public"

# ──────────────────────────────────────────────────────────
# better-auth — Authentication library configuration
# BETTER_AUTH_SECRET: Random secret (min 32 chars) for signing sessions & tokens
# BETTER_AUTH_URL:    The canonical URL of this backend (used in redirects & CORS)
# ──────────────────────────────────────────────────────────
BETTER_AUTH_SECRET="your-super-secret-key-minimum-32-characters"
BETTER_AUTH_URL="http://localhost:3000"

# ──────────────────────────────────────────────────────────
# SMTP — Nodemailer email sender (for OTP, password reset emails)
# Using Gmail App Password — see: https://myaccount.google.com/apppasswords
# ──────────────────────────────────────────────────────────
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-gmail-app-password"

# ──────────────────────────────────────────────────────────
# Google OAuth — Server-side credentials for OAuth 2.0
# Get from: https://console.cloud.google.com/apis/credentials
# ──────────────────────────────────────────────────────────
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | ✅ Yes | Runtime environment (`development` / `production` / `test`) |
| `PORT` | ✅ Yes | Port the Express HTTP server binds to (default: `3000`) |
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string used by Prisma ORM |
| `BETTER_AUTH_SECRET` | ✅ Yes | Minimum 32-character secret for signing JWT / session tokens |
| `BETTER_AUTH_URL` | ✅ Yes | Canonical backend URL; used by `better-auth` for redirects and CORS |
| `SMTP_USER` | ✅ Yes | Gmail address used as the "from" sender for transactional emails |
| `SMTP_PASS` | ✅ Yes | Gmail **App Password** (not your account password) for SMTP auth |
| `GOOGLE_CLIENT_ID` | ✅ Yes | Google OAuth 2.0 Client ID for server-side token verification |
| `GOOGLE_CLIENT_SECRET` | ✅ Yes | Google OAuth 2.0 Client Secret for server-side OAuth exchange |

### Backend Getting Started

```bash
cd assessment-integrity-backend

# Install dependencies
pnpm install

# Generate Prisma client
pnpm prisma:generate

# Run database migrations
pnpm prisma:migrate

# Start development server with hot-reload (http://localhost:3000)
pnpm dev

# Open Prisma Studio (visual DB browser)
pnpm prisma:studio

# Lint / format code
pnpm lint
pnpm format
```

---

## Database

The backend uses **PostgreSQL** with **Prisma ORM**.

### Models

| Model | Table | Description |
|---|---|---|
| `User` | `users` | Core user record — name, email, role, status, suspension |
| `Session` | `sessions` | Active auth sessions (token, expiry, IP, user-agent) |
| `Account` | `accounts` | OAuth / credential-linked accounts per user |
| `Verification` | `verifications` | OTP / email verification tokens |
| `UserLog` | `user_logs` | Audit log of user actions (login, register, suspend, etc.) |

### User Roles & Statuses

- **Roles:** `user` (default), `admin`
- **Statuses:** `active` (default), `suspended`
- Suspended users can have an optional `suspendedUntil` datetime for temporary suspensions.

---

## Scripts Reference

### Frontend (`assessment-integrity/`)

| Script | Command | Description |
|---|---|---|
| `dev` | `pnpm dev` | Start Vite dev server |
| `build` | `pnpm build` | Build production bundle to `dist/` |

### Backend (`assessment-integrity-backend/`)

| Script | Command | Description |
|---|---|---|
| `dev` | `pnpm dev` | Start Express with `tsx` watch mode |
| `build` | `pnpm build` | Compile TypeScript to `dist/` |
| `start` | `pnpm start` | Run compiled production build |
| `prisma:generate` | `pnpm prisma:generate` | Regenerate Prisma client after schema changes |
| `prisma:migrate` | `pnpm prisma:migrate` | Apply pending Prisma migrations |
| `prisma:studio` | `pnpm prisma:studio` | Open Prisma Studio GUI |
| `lint` | `pnpm lint` | Biome lint check |
| `format` | `pnpm format` | Biome format |
| `check` | `pnpm check` | Biome lint + format check |
| `check:fix` | `pnpm check:fix` | Biome auto-fix |

---

> **Security:** Never commit real `.env` files. Both projects include `.gitignore` rules to exclude them. Use `.env.example` files for documentation purposes in shared repos.
