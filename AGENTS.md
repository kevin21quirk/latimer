# AGENTS.md

Project: Latimer Community platform (evolution of burton-latimer-community). Plan: `docs/PLATFORM-PLAN.md`.

## Stack
Next.js 16 App Router, React 19, Prisma 6 + Neon (Lakebase Postgres 18, London), Vercel Blob for uploads (planned), Tailwind 4 + shadcn/ui, custom jose JWT auth (`auth-token` cookie, `lib/auth.ts`), Resend email, Vercel hosting.

## Neon
- Linked via `.neon` (git-ignored): project `flat-night-82000782` (SaaS_Community_Product, `aws-eu-west-2`), branch `production`. Infra declared in `neon.ts` (currently empty config: Postgres only); preview with `neon config plan`, apply with `neon deploy`.
- Neon Object Storage, Functions and AI Gateway are NOT available in eu-west-2; do not declare them in `neon.ts` (env pull will fail).
- `neon link` / `checkout` / `deploy` write `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `NEON_BRANCH` to `.env.local` (git-ignored). Never commit or print these.
- Do not develop or run migrations on `production`. Use `neon checkout dev-<feature> --create` (branch-first flow), and `neon diff` before merging.
- Prisma CLI loads env via `prisma.config.ts` (`dotenv/config` reads `.env` only, not `.env.local`). Use `DATABASE_URL_UNPOOLED` for migrations.
- Neon skills are installed in `.agents/skills/` (neon, neon-postgres, neon-object-storage, ...). `neon skills` requires Node >= 22.20; local Node is 22.14, so run via `npx -y node@22.20.0 "$(npm root -g)/neon/dist/cli.js" skills ...`.

## Verification commands
- Install: `npm ci` (runs `prisma generate`)
- Typecheck: `npx tsc --noEmit`
- Lint: `npx eslint .` (baseline has 42 pre-existing errors until Stage 0.4)
- Build: `npx next build` (needs `DATABASE_URL` and `NEXTAUTH_SECRET` set; placeholder values are fine for build)

## Rules
- The new platform has its own Neon project, separate from the live app's database. Live data is migrated at cut-over.
- Sensitive data (HelpRequest, anonymous posts, messages, wellbeing, DOB/address/phone/email) must never appear in public pages, search, feed, sitemaps, public APIs, AI calls, or public buckets.
