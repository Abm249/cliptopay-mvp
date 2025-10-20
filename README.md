# CliptoPay MVP (Next.js + Auth.js + Prisma + Tailwind)

**Features**

- TikTok OAuth via Auth.js provider
- Email/password signup (Credentials) for quick onboarding
- Creator/Clipper dashboards
- Project approvals & disputes
- Append-only **payout ledger** with SHA-256 hash chaining
- Leaderboard, reputation, and **niche matching** (Jaccard)
- Admin panel (role-based middleware)

## 1) Quick Start

```bash
pnpm i # or npm i / yarn
cp .env.example .env
npx prisma db push
npm run db:seed
npm run dev
```

Open http://localhost:3000

- Admin user: `demo@clippay.dev` (no password, sign in with TikTok once you configure, or create a credentials account manually via /signup)
- Demo clipper: `clipper@clippay.dev`

## 2) TikTok OAuth (Auth.js)

This project uses the official **TikTok provider** from Auth.js/NextAuth v5.

- Docs: Auth.js TikTok provider (authjs.dev)  
- TikTok Login Kit (developers.tiktok.com)

Environment variables:

```
AUTH_TIKTOK_ID=your_tiktok_client_key
AUTH_TIKTOK_SECRET=your_tiktok_client_secret
NEXTAUTH_URL=http://localhost:3000
AUTH_SECRET=your_long_random_secret
```

In TikTok developer console, set redirect URL to:

```
http://localhost:3000/api/auth/callback/tiktok
```

Then start the app and click **Continue with TikTok**.

## 3) Immutable Payout Ledger

Every clip submission appends a ledger entry with `prevHash` and `entryHash` (SHA-256). Any tampering breaks the chain.

- Event types: `CALCULATED`, `ADJUSTMENT`, `PAID` (extend as needed).

## 4) Roles & Admin

- `User.role` defaults to `USER`. Make someone admin by setting `role = ADMIN` in DB.
- `/admin` is protected by middleware. Use it to resolve disputes and view ledger.

## 5) Leaderboard & Niche Matching

- Leaderboard ranks clippers by total views and earnings.
- Niche matching uses Jaccard similarity between your niches and clippers' niches.

## 6) Deploy

- **Vercel**: set env vars, run `prisma db push` during build (or switch to hosted Postgres).  
- **Database**: Change `DATABASE_URL` to PostgreSQL in production for concurrency.

## 7) Notes

- The TikTok OAuth flow requires your app to be approved for scopes.  
- Add YouTube/Instagram OAuth similarly by adding providers in `src/auth.ts`.  
- For real view tracking, schedule jobs to poll platform APIs and append `PayoutLedger` entries on updates.

---

MIT
