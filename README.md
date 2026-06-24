# AQAR - Property Management MVP

A B2B SaaS property management cockpit for managing properties, units, tenants, documents, and tasks.

## Tech Stack

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Database:** PostgreSQL + Prisma 7
- **Auth:** Auth.js (NextAuth v5) with email magic link + dev login fallback
- **UI:** TailwindCSS + shadcn/ui
- **Storage:** S3-compatible (AWS S3 / Cloudflare R2) or local uploads

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL running locally (or remote)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your database URL:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/aqar?schema=public"
AUTH_SECRET="your-secret-here"
```

### 3. Create the database

```bash
createdb aqar
```

### 4. Run migrations

```bash
npx prisma migrate dev --name init
```

### 5. Generate Prisma client

```bash
npx prisma generate
```

### 6. Seed demo data

```bash
npm run db:seed
```

### 7. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Dev Login

In development mode, sign in with any email (e.g., `demo@aqar.dev` from seed data) using the **Dev Sign In** button. No actual email is sent.

## Project Structure

```
src/
  app/
    (auth)/login/         # Login page
    (app)/                # Authenticated app shell
      dashboard/          # Dashboard with stats
      properties/         # Properties list + detail
      units/[id]/         # Unit detail + lease management
      tenants/            # Tenants list + detail
      documents/          # Document list + upload
      tasks/              # Task list + CRUD
      settings/           # Organization settings
    api/
      auth/[...nextauth]/ # Auth.js handlers
      upload/             # File upload endpoint
      documents/[id]/     # Document download
  components/
    ui/                   # shadcn/ui components
    sidebar.tsx           # Navigation sidebar
    topbar.tsx            # Top bar with user menu
  lib/
    auth.ts               # Auth.js configuration
    auth-guard.ts         # requireAuth() + requireOrg()
    prisma.ts             # Prisma client singleton
    actions.ts            # Server actions (CRUD)
    storage.ts            # File storage (local/S3)
    validators.ts         # Zod schemas
    utils.ts              # Utilities
  generated/prisma/       # Generated Prisma client
```

## Features

- Multi-tenant (organization-scoped data)
- Properties with units
- Tenant management
- Lease tracking (create, activate, end)
- Task management with status workflow
- Document upload and download
- Dashboard with portfolio overview
- Dev login fallback (no email setup needed)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:reset` | Reset database |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | Auth.js secret key |
| `AUTH_TRUST_HOST` | Dev | Set to `true` for local dev |
| `RESEND_API_KEY` | No | Resend API key for magic links |
| `EMAIL_FROM` | No | Sender email for magic links |
| `S3_BUCKET` | No | S3 bucket name |
| `S3_REGION` | No | S3 region |
| `S3_ACCESS_KEY_ID` | No | S3 access key |
| `S3_SECRET_ACCESS_KEY` | No | S3 secret key |
| `S3_ENDPOINT` | No | Custom S3 endpoint (for R2) |
| `MAX_FILE_SIZE` | No | Upload limit in bytes (default: 10MB) |
