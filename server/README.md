# CivicLeder API server

Independent Node.js + TypeScript + Express + Prisma backend. Uses **MySQL**. Does not use Supabase or PostgreSQL at runtime.

Legacy Supabase SQL remains under `/backend` for reference only.

## Prerequisites

- Node.js 20+
- MySQL 8.x running locally or remote
- Create database + user, e.g.:

```sql
CREATE DATABASE civicleader CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'civicleader'@'%' IDENTIFIED BY 'civicleader';
GRANT ALL ON civicleader.* TO 'civicleader'@'%';
FLUSH PRIVILEGES;
```

## Setup

```bash
cd server
cp .env.example .env
# edit DATABASE_URL
npm install
npx prisma generate
npx prisma migrate dev --name init
# or: npx prisma db push
npm run db:seed
npm run dev
```

Health check: `GET http://localhost:3000/health`

API base: `http://localhost:3000/api/v1`

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server with reload |
| `npm run build` | Compile to `dist/` |
| `npm start` | Run compiled server (`node dist/server.js` after build — entry is `src/server.ts`) |
| `npm run db:generate` | Prisma client |
| `npm run db:migrate` | Migrate |
| `npm run db:push` | Push schema without migration history |
| `npm run db:seed` | Seed core reference data |
| `npm run typecheck` | `tsc --noEmit` |

## Environment

See `.env.example`. Never commit `.env`.

Mobile app only needs:

```bash
EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1
```

On a physical phone, use your machine LAN IP instead of `localhost`.

## Storage

`STORAGE_DRIVER=local` writes evidence under `uploads/report-evidence/{draftKey}/{evidenceId}.{ext}`.

The directory is not publicly served. Upload only via `POST /api/v1/evidence`.

## Docs

- [API.md](./docs/API.md)
- [DATABASE.md](./docs/DATABASE.md)
- [MIGRATION_FROM_SUPABASE.md](./docs/MIGRATION_FROM_SUPABASE.md)
