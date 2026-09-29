# AGENTS.md

Project: Latimer Community platform (evolution of burton-latimer-community). Plan: `docs/PLATFORM-PLAN.md`.

## Stack
Next.js 16 App Router, React 19, Prisma 6 + Neon (Lakebase Postgres 18, London), Vercel Blob for uploads (planned), Tailwind 4 + shadcn/ui, custom jose JWT auth (`auth-token` cookie, `lib/auth.ts`), Resend email, Vercel hosting.

## Neon
- Linked via `.neon` (git-ignored): project `flat-night-82000782` (SaaS_Community_Product, `aws-eu-west-2`), branch `production`. Infra declared in `neon.ts` (currently empty config: Postgres only); preview with `neon config plan`, apply with `neon deploy`.
- Neon Object Storage, Functions and AI Gateway are NOT available in eu-west-2; do not declare them in `neon.ts` (env pull will fail).
- `neon link` / `checkout` / `deploy` write `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `NEON_BRANCH` to `.env.local` (git-ignored). Never commit or print these.
- Do not develop or run migrations on `production`. Use `neon checkout dev-<feature> --create` (branch-first flow), and `neon diff` before merging.
- Prisma CLI loads `.env.local` then `.env` via `prisma.config.ts`. Migrations use `directUrl = env("DATABASE_URL_UNPOOLED")` (direct, non-pooler); the app uses pooled `DATABASE_URL`.
- Baseline: `prisma/migrations/0_init` = the live app's schema (drift-checked: identical). New schema changes: `npx prisma migrate dev --name <change>` on a dev branch, then `npx prisma migrate deploy` elsewhere.
- NEVER pass a real branch as `--shadow-database-url`: Prisma resets the shadow DB. Use a throwaway branch (`neon branch create --name shadow-tmp ...`) and delete it afterwards.
- Cut-over: after restoring live data into the new project, run `npx prisma migrate resolve --applied 0_init`, then `migrate deploy`.
- Neon skills are installed in `.agents/skills/` (neon, neon-postgres, neon-object-storage, ...). `neon skills` requires Node >= 22.20; local Node is 22.14, so run via `npx -y node@22.20.0 "$(npm root -g)/neon/dist/cli.js" skills ...`.

## Verification commands
- Install: `npm ci` (runs `prisma generate`)
- Typecheck: `npm run typecheck`
- Lint: `npm run lint` (0 errors; ~111 pre-existing warnings)
- Tests: `npm test` (unit + integration), `npm run test:unit`, `npm run test:integration` (needs `TEST_DATABASE_URL` in `.env.test.local`, pointing at the Neon `test` branch)
- Build: `npm run build` (needs `DATABASE_URL` and `NEXTAUTH_SECRET` set; placeholder values are fine for build)

## Platform libs (Stage 0.5)
- `lib/auth.ts`: `getSession(request?)` (cookie or `Authorization: Bearer`), `requireAuth`, `requireAdmin`, `signSessionToken` (JWT carries `tv` = User.tokenVersion), `revokeAllSessions`.
- `lib/with-route.ts`: `withRoute(handler, { auth: "none"|"optional"|"user"|"admin", rateLimit: { limit, windowMs, key? } })` — uniform auth, Postgres rate limiting (`lib/rate-limit.ts`) and error mapping (`HttpError` → status, `ZodError` → 400, else 500). New API routes should use this.
- `lib/permissions.ts`: `roleOf`, `hasPermission`, `canInitiateDirectMessage` (businesses can't DM residents).
- `lib/audit.ts`: `logAudit` (never throws). `lib/projections.ts`: member/public user selects + `toPublicUser` ("Sarah P."). `lib/errors.ts`: `HttpError` + helpers. `lib/env.ts`: lazy env validation.

## Rules
- The new platform has its own Neon project, separate from the live app's database. Live data is migrated at cut-over.
- Sensitive data (HelpRequest, anonymous posts, messages, wellbeing, DOB/address/phone/email) must never appear in public pages, search, feed, sitemaps, public APIs, AI calls, or public buckets.
