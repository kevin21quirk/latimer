# Latimer Community Platform – Technical Plan

Status: **APPROVED (2026-09-28)**. All recommendations in §10 accepted.
Source: this repository is a local clone of `kevin21quirk/burton-latimer-community` @ `1c3e4a4` (full history kept, `origin` remote removed so nothing can be pushed to the live repo by mistake).

Contents
1. Existing architecture report
2. Database / schema assessment
3. Existing functionality map
4. Audit findings (security & safeguarding)
5. Proposed architecture
6. Proposed database changes
7. Proposed API structure
8. UI / UX plan
9. Implementation plan (small deployable stages)
10. Decisions needed

---

## 1. Existing architecture report

| Area | Current state |
|---|---|
| Framework | Next.js 16.1.6 App Router, React 19.2, React Compiler enabled, Turbopack |
| UI | Tailwind CSS 4, shadcn/ui (Radix), lucide-react, Geist font. Accent colour gold `oklch(0.75 0.15 85)` / `#D4AF37`, near-black primary |
| Rendering | Server components fetch session and data with Prisma, then pass it to large `"use client"` components (for example `DashboardClient.tsx`, `AdminDashboard.tsx` of ~1,200 lines) |
| API | Route handlers under `app/api/**` (54 routes). Input validated with zod in about half of them. No versioning, and error shapes are inconsistent (`{message}` vs `{error}`) |
| Database | PostgreSQL on Neon; Prisma 6.19 (`prisma-client-js`). `@neondatabase/serverless` and `@prisma/adapter-neon` are installed but not used |
| Migrations | **None.** There is no `prisma/migrations` folder, so the schema has been applied with `db push` |
| Auth | Custom: bcryptjs password check, then a `jose` HS256 token (7 days) in the httpOnly cookie `auth-token`. Payload: `{userId, email, accountType}`. `lib/auth.ts#getSession/requireAuth`. `middleware.ts` protects `/dashboard`, `/profile`, `/messages`, `/groups` only. `next-auth` is installed but **unused**, and `jose` is only present as a transitive dependency of next-auth |
| Roles | `User.accountType` enum (INDIVIDUAL / CHARITY / COMPANY) plus `User.isAdmin` boolean. The admin check is copy-pasted into about 20 files, each with its own secret fallback |
| Group roles | `GroupMember.role` ADMIN / MEMBER |
| Files / images | Base64 data URLs stored directly in Postgres (`profileImage`, `Post.images`, `Group.image`, newsletter images) |
| Email | Resend (`lib/email.ts`), used for newsletters. Env: `RESEND_API_KEY`, `EMAIL_FROM`, `NEXT_PUBLIC_APP_URL` |
| Moderation | `lib/moderation.ts` keyword/regex risk scoring. It is called from the browser before posting, and the browser then sends `riskScore`/`isFlagged` to `POST /api/posts` |
| Hosting | Vercel (auto-deploy from GitHub `master`), Neon Postgres (EU) |
| Env vars | `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NODE_ENV`, `RESEND_API_KEY`, `EMAIL_FROM`, `NEXT_PUBLIC_APP_URL`. The comments route also reads `JWT_SECRET` (see findings) |
| Third-party | Neon, Vercel, Resend. No Stripe, analytics, maps, blob storage or error tracking |
| Tests / CI | None |
| Baseline health (this clone) | `tsc --noEmit` ✅ · `next build` ✅ · `eslint` ❌ 42 errors / 111 warnings (pre-existing) · `npm audit`: 34 vulns incl. **critical in `next` (≤16.3.2)** and `@auth/core` (unused next-auth) |

## 2. Database / schema assessment

Models: `User, Post, Comment, Like, Message, Group, GroupMember, GroupJoinRequest, Follow, Connection, Report, HelpRequest, LocalService, WellbeingResource, Alert, UserAccessibilityPreferences, Newsletter`.

Strengths
- cuid IDs, sensible indexes, cascade deletes, moderation fields on `Post`.
- `Alert`, `LocalService`, `Report` and `Follow` are reusable foundations.

Gaps against the new product
- **No location model.** `User.city` is a free-text string defaulting to "Burton Latimer". No other content has a location.
- **Businesses are just users** (`companyName`, `businessType`, `website` on `User`). There are no profiles, categories, hours, photos, services or multi-user management.
- Categories are **hard-coded enums** (`ServiceCategory`, `HelpRequestType`, `AlertType`, `PostType`).
- Events are only a `PostType.EVENT` label on a free-text post, with no date, time or venue.
- `Report` only targets users/posts. There is no generic content reporting.
- No notifications, favourites, subscriptions/plans, analytics, audit log, media assets or user suspension.
- No generated search columns or full-text indexes.
- Base64 images in rows will bloat tables and slow queries as content grows.
- No migration history. Before any schema change we must baseline (`0_init`) and check for drift against production.

Database separation (updated): the new platform has its **own Neon project**: `flat-night-82000782` ("SaaS_Community_Product"), `aws-eu-west-2` (London), Postgres 18, linked branch `production`, currently empty. The live app keeps its own database (Neon project `aws-eu-west-2`, same account) until cut-over. Consequences:
- New migrations do not need to preserve compatibility with the live app. They must still be safe, reviewed and tested on a Neon branch.
- The cut-over needs a **data migration**: `pg_dump` from the live project, restore into a branch of the new project, apply the baseline plus new migrations, then verify. Rehearse it on a branch first. Both projects are in London, so data stays in the UK.
- Neon Object Storage, Functions and AI Gateway are **not available in eu-west-2**, so the plan does not depend on them.

## 3. Existing functionality map

| Feature | Pages | API | Models | Keep / evolve |
|---|---|---|---|---|
| Register / login / logout | `/register`, `/login` | `/api/auth/*` | User | Keep. Add Bearer-token support for mobile, email verification and suspension |
| Social feed, posts, likes, comments | `/dashboard` | `/api/posts/**` | Post, Like, Comment | Keep as the "Neighbours" social area. Fix leaks (§4) |
| Safe Space (anonymous posts) | Dashboard section | `/api/posts/anonymous` | Post.isAnonymous | Keep. **Sensitive.** Fix exposure (§4) |
| Moderation queue, flags | `/admin/moderation` | `/api/admin/moderation/**`, `/api/posts/[id]/flag`, `/api/posts/moderate` | Post moderation fields | Evolve into a unified moderation queue |
| Groups (interest groups with posts, join approval) | `/groups`, `/groups/[id]/manage` | `/api/groups/**` | Group, GroupMember, GroupJoinRequest | Keep. These are *social groups*, distinct from the new *organisation profiles* |
| Connections / contacts / block | `/contacts` | `/api/connections/**` | Connection | Keep |
| Direct messages | `/messages` | `/api/messages/**` | Message | Keep for resident↔resident. New business enquiries use a separate structured thread system |
| Discover people/groups by interest | `/discover` | – | User.interests, Group.interests | Keep. Fix data over-exposure (§4) |
| Help requests / volunteering (vulnerable people) | `/help-support` | `/api/help-requests/**`, admin | HelpRequest | **Preserve.** Tighten visibility. Link from the new "Get involved" hub |
| Local services (care, council, food bank…) | `/local-services` | `/api/local-services`, admin verify | LocalService | Keep. Surface later as "Support services" alongside the directory |
| Wellbeing resources | `/wellbeing` | admin publish | WellbeingResource | Keep |
| Alerts | `/alerts` | admin toggle | Alert | Evolve into Local Alerts v2 (additive fields) |
| Accessibility prefs | profile | profile | UserAccessibilityPreferences | Keep and honour in the new UI |
| Profile, GDPR export, delete, image | `/profile` | `/api/profile/**` | User | Keep. Extend the export to cover new data |
| Reports | admin | `/api/reports/**` | Report | Keep. Add generic content reports |
| Newsletter | `/admin/newsletter` | `/api/admin/newsletter` | Newsletter | Keep. Later becomes the "community digest" |
| Admin dashboard | `/admin` | `/api/admin/**` | – | Evolve into Admin v2 |
| Public marketing pages | `/`, `/contact`, `/privacy`, `/terms` | – | – | `/` gets replaced by the data-driven homepage |

## 4. Audit findings (security & safeguarding)

**Critical – affects the live site today**

1. **Anonymous "Safe Space" posts are not anonymous.** `POST /api/posts/anonymous` stores the author's `userId`. Neither `app/dashboard/page.tsx` nor `GET /api/posts` filters `isAnonymous`, and `DashboardClient` renders `post.user.firstName/lastName/profileImage`. An anonymous post therefore appears in every member's main feed **with the author's real name and photo**.
2. **`GET /api/posts` needs no login** and has no group filter. Anyone on the internet can page through all non-hidden posts, including anonymous posts with real names and posts from *private* groups.
3. **Every member's email address and interests are sent to every logged-in user's browser** on `/discover` (`allUsers` includes `email`). `/api/users/search` also returns emails and allows searching by email prefix (enumeration).

**High**

4. **Help requests are visible to every account type**, including businesses. Requester name, photo, city, location text and description are included. Any account can make itself the "helper" in one click with no vetting.
5. **Moderation is enforced by the client.** `POST /api/posts` trusts `riskScore`/`isFlagged` from the request body, so moderation can be skipped by calling the API directly.
6. **Anyone can direct-message anyone**, including vulnerable residents, with no connection or consent. That becomes a real risk once businesses are onboarded.
7. **Secret handling.** Four different fallback secrets are hard-coded (`"your-secret-key-change-in-production"`, `"fallback-secret"`, `"your-secret-key"`). The comments route reads `JWT_SECRET` instead of `NEXTAUTH_SECRET`, so **commenting fails in production unless `JWT_SECRET` happens to equal `NEXTAUTH_SECRET`**. If a secret is missing, tokens become forgeable.
8. **Vulnerable dependencies:** critical CVEs in `next` ≤16.3.2 and in the unused `next-auth`/`@auth/core`.

**Medium**
9. No rate limiting on login, registration, posting or messaging. No email verification.
10. No audit log for admin actions (delete user, grant admin, hide posts).
11. Group join does not check that the group is `APPROVED`. The group `PATCH` accepts arbitrary image strings.
12. No token revocation (a suspended or deleted user's token stays valid for up to 7 days). No user suspension at all.
13. Unlimited base64 uploads (DoS / DB bloat).

➡️ Items 1–3 and 7 should be **hot-fixed on the live repo now**, independently of this project (see §10).

## 5. Proposed architecture

### 5.1 Principles
- **Same stack**: Next.js App Router + Prisma + Neon + Tailwind/shadcn + Resend on Vercel. Add only **Vercel Blob** (images and files, behind a `MediaStorage` interface), **Stripe** (Phase 3) and later an AI provider.
- **Keep the existing auth** (jose token). Do not adopt next-auth; remove the unused dependency and add `jose` directly.
- **Service layer first**: business logic lives in plain TypeScript modules. Route handlers and server components are thin callers, so a future React Native/Expo app reuses the same `/api/v1` endpoints.
- **Additive only** while sharing the production DB with the live app.
- **Configurable**: categories, locations, plans, ad products and notification types live in the database.
- **Secure by default**: every public read goes through explicit "public projections" (no `include` of whole `User` rows).

### 5.2 Code layout (new code; existing folders untouched)
```
app/
  (public)/                     SSR, indexable, no login required
    page.tsx                    homepage (default community)
    [community]/                /burton-latimer, /kettering …
      page.tsx                  "Around Burton Latimer"
      businesses/[[...category]]/   directory + category landing pages
      events/  offers/  jobs/  groups/  community/  marketplace/  alerts/  volunteer/
    business/[slug]/            canonical business profile
    organisation/[slug]/        canonical community group/charity profile
    event/[slug]/  job/[slug]/ …
  (app)/                        logged-in shell (bottom nav on mobile)
    home/  saved/  notifications/  enquiries/  onboarding/
    business-dashboard/[orgSlug]/…     profile, offers, events, jobs, enquiries, analytics, billing
  admin/                        existing admin + new v2 sections
  api/                          existing routes (unchanged paths)
  api/v1/                       new versioned JSON API (web + future mobile)
  manifest.ts  sitemap.ts  robots.ts
lib/
  server/                       server-only
    auth/        session.ts (cookie + Bearer), tokens.ts, permissions.ts, roles.ts
    http/        route.ts (withRoute: auth, permission, zod, rate-limit, error shape), errors.ts, pagination.ts
    db/          prisma.ts, public-projections.ts
    platform/    env.ts (zod-validated env), rate-limit.ts, audit.ts, cache.ts
    modules/
      locations/  organisations/  categories/  directory/  search/
      events/  offers/  enquiries/  threads/  community/ (questions, answers, recommendations)
      jobs/  volunteering/  marketplace/  alerts/  moderation/  trust/
      follows/  feed/  notifications/  billing/  advertising/  analytics/  media/  ai/  seo/
  contracts/                    zod schemas + TS types shared by server, web client and future mobile client
components/
  platform/                     new design system (cards, AppShell, BottomNav, ActionSheet, SearchBar…)
  <existing folders unchanged>
```
Each module exposes `service.ts` (logic), `schemas.ts` (zod), `queries.ts` (Prisma reads with public projections) and optionally `events.ts` (domain events it emits).

### 5.3 Authentication (web + future mobile)
- `getSession()` accepts the existing `auth-token` cookie **or** `Authorization: Bearer <token>`. Existing sessions keep working.
- Add `User.tokenVersion`. The token includes `tv`, and a mismatch means revoked (supports logout everywhere, suspension and password change). Add `User.status` (ACTIVE / SUSPENDED / DELETED).
- One source of secrets: `env.AUTH_SECRET` (read from `NEXTAUTH_SECRET` for compatibility). **No fallbacks**, so a missing secret fails at boot.
- Phase 5: short-lived access token + rotating refresh token for native apps.
- Email verification (`emailVerifiedAt`) is required for posting public content, enquiries and marketplace. Existing users are grandfathered as verified.

### 5.4 Roles & permissions
- **Platform roles** in the DB: `Role {key, name, permissions[]}` + `UserRole {userId, roleId, locationId?}`. A `locationId` scopes a role (e.g. moderator for Kettering only). Seeded: `resident`, `business_owner`, `org_manager`, `verified_volunteer`, `moderator`, `community_admin`, `super_admin`.
- Permissions are string constants in code (`events.publish`, `orgs.verify`, `moderation.review`, `help_requests.view` …). Checks go through `can(session, permission, {locationId, orgId})`. New roles are data, not code.
- **Organisation roles**: `OrganisationMember.role` OWNER / MANAGER / STAFF.
- **Compatibility**: a migration grants `super_admin` to every `isAdmin=true` user. `isAdmin` stays in sync until old admin pages are retired. `accountType` stays as the user's persona.

### 5.5 Locations & multi-community
- `Location` tree: COUNTRY → COUNTY → DISTRICT → TOWN → NEIGHBOURHOOD, with `slug`, `path` (e.g. `gb/northamptonshire/north-northamptonshire/burton-latimer`), lat/lng, `isCommunity`, `isLive`, `settings` (JSON: branding, contact, default radius).
- Seed: UK → Northamptonshire → North Northamptonshire → Burton Latimer (**live**). Kettering, Finedon, Rothwell, Corby, Wellingborough and Northampton are created **not live**.
- All new content has `locationId`. Businesses also have **service areas** (a plumber in Kettering can serve Burton Latimer). Queries use `path` prefix matching for "this town and its neighbourhoods" and radius search for distance.
- Routing: `/{community-slug}/…`. A reserved-slug list prevents clashes with `/admin`, `/api`, `/login` etc. Canonical entity URLs (`/business/abc-plumbing`) are community-independent, so a business can appear in several towns without duplicate content.
- `/` renders the default community's homepage while only one community is live. When a second launches, `/` becomes a picker with a remembered choice or geo suggestion.
- Local moderators and admins come from location-scoped roles. Local advertising comes from `Promotion.locationId`.

### 5.6 Search (built so it can grow)
- `SearchProvider` interface: `search({q, types, locationId, geo, radiusKm, categoryIds, openNow, hasOffer, verified, featured, cursor})`.
- v1 implementation: **Postgres full-text search + `pg_trgm`** over a denormalised `SearchDocument` table (one row per public business, event, organisation, job or offer). It holds a weighted `tsvector` (title A, categories/synonyms B, body C), lat/lng, flags and facets, and is kept in sync by module services on publish/update/unpublish.
- **Category synonyms** (`Category.synonyms[]`, admin-editable) handle "leaking tap" → Plumbers in v1 without AI.
- "Open now" is evaluated against `OpeningHours` in Europe/London. Distance uses Haversine SQL on lat/lng; postcodes are geocoded via postcodes.io (free UK open data).
- Phase 4: add an `embedding vector` column (pgvector, supported on Neon) plus a `QueryUnderstanding` step (AI → `{category, intent, dateRange}`) that feeds the **same** filters. No restructuring needed.

### 5.7 Feed ("Around Burton Latimer")
- A denormalised `FeedItem` index `{contentType, contentId, locationId, orgId, categoryIds, publishedAt, relevantUntil, trustLevel, isSponsored, visibility}` is written by services on publish.
- `FeedService` reads with cursor pagination (20 per page) and ranks by: freshness decay + time relevance (an event tomorrow outranks one next month) + trust level + follow/interest match (personalised) + a **labelled** sponsored slot every *N* cards, with diversity so it isn't ten offers in a row.
- It renders typed cards (EventCard, OfferCard, QuestionCard, AlertCard …) rather than generic posts.

### 5.8 Notifications
- Domain events (`event.published`, `offer.published`, `answer.created`, `enquiry.received`, `alert.published` …) go to `notifications/dispatcher`. It resolves recipients (followers, interests, location, participants), applies `NotificationPreference` (per type: in-app / email / push; instant / daily digest / weekly / off) and a per-user daily cap, then writes `Notification` rows and an `EmailOutbox`.
- Vercel Cron processes the outbox and sends digests via Resend. **Non-urgent types default to digest.**
- `DeviceToken` (WEB_PUSH / EXPO / FCM / APNS) exists from day one, so push is just another channel adapter later.

### 5.9 Billing & advertising (Phase 3, designed now)
- `Plan` (prices, interval and `entitlements` JSON: `maxPhotos`, `offers.maxActive`, `jobs.enabled`, `analytics.level`, `featured.included` …). **No prices in code.**
- `OrganisationSubscription` (provider-agnostic fields plus provider IDs).
- **Entitlements service**: `entitled(org, 'offers.publish')`. All gating goes through this. Admins can grant plans manually (launch offers, free trials).
- `BillingProvider` interface (`createCheckout`, `createPortalSession`, `handleWebhook`) with a `StripeProvider` implementation. The Free plan never touches Stripe.
- `AdProduct` (FEATURED_LISTING, HOMEPAGE_SPOT, SPONSORED_EVENT, SPONSORED_OFFER, PROMOTED_JOB; price, duration and slot capacity per location are configurable). `Promotion` is a booking for a target, location/category and dates. A placement service does fair rotation. Everything is **always labelled "Sponsored"**, and impressions/clicks feed analytics.

### 5.10 Analytics
- `AnalyticsEvent` (append-only: PROFILE_VIEW, SEARCH_IMPRESSION, CLICK_WEBSITE / PHONE / DIRECTIONS, ENQUIRY, OFFER_VIEW / CLAIM / REDEEM, PROMO_IMPRESSION / CLICK). It stores a hashed session key and never a raw IP. Known bots are filtered.
- A nightly cron rolls up into `AnalyticsDaily` for fast dashboards. Platform metrics come from the rollups plus table counts. No third-party trackers.

### 5.11 Media
- **Vercel Blob** behind a small `MediaStorage` interface (`createUploadToken`, `getUrl`, `delete`), so the provider can later be swapped for S3 in `eu-west-2` or Neon Object Storage if it reaches London, without touching feature code. When creating the Blob store, choose the region nearest the UK if offered.
- Uploads use server-authorised client uploads (image MIME allow-list, 5 MB limit, per-user rate limit). The database stores object **keys** plus metadata in `MediaAsset`. Public business and event images use public blobs with versioned keys (`orgs/<id>/<uuid>.webp`). Anything private or sensitive is **not** stored in public blobs.
- A `MediaAsset` record (owner, org, dimensions, alt text). `next/image` handles optimisation.
- Existing base64 images are untouched, with an optional backfill script later.

### 5.12 AI (Phase 4, interface now)
- `AIProvider` interface: `classify(text, taxonomy)`, `extractEvent(text)`, `draftProfile(input)`, `parseSearchQuery(q)`, `embed(text)`. Default `NoopProvider`, so nothing depends on AI being present.
- AI output is always an editable **suggestion** and never auto-published.
- **Sensitive data (help requests, Safe Space, wellbeing, messages) is never sent to an AI provider.**

### 5.13 Safeguarding model (Section 35)
Sensitive data classes: `HelpRequest`, anonymous posts and `anonymousContactEmail`, `Message`, wellbeing usage, `UserAccessibilityPreferences`, `dateOfBirth`, `address`, `phoneNumber`, `postcode`, `email`, `Report`.
Rules, enforced in code and by tests:
1. Never indexed into `SearchDocument` / `FeedItem`, never in sitemaps, public pages, public APIs or AI calls.
2. All public reads use `public-projections.ts`. Automated tests assert that public endpoints never return these fields and never return anonymous authors.
3. Businesses cannot initiate DMs. They can only reply inside an enquiry thread the resident started.
4. Help-request visibility is tightened (proposal in §10).
5. Resident names on public (logged-out) pages appear as first name + last initial, or hidden per a privacy setting.
6. Every admin view of sensitive records is audit-logged.

### 5.14 Platform concerns
- **Rate limiting**: `RateLimiter` interface, v1 backed by Postgres (no new service). Can be swapped for Upstash Redis.
- **Audit log**: `AuditLog {actorId, action, targetType, targetId, metadata, createdAt}` for every admin and moderation action.
- **Security headers** (CSP, HSTS, frame-ancestors, referrer policy) set in `next.config.ts`.
- **Caching**: public pages use Next caching with tag revalidation on publish. Lists are always paginated (cursor, 20 items).
- **Testing**: Vitest (services and privacy tests against a Neon test branch), Playwright (smoke flows at mobile and desktop sizes). GitHub Actions runs lint, typecheck, tests and build.

## 6. Proposed database changes (all additive)

Enums: `LocationType`, `OrgType` (BUSINESS, COMMUNITY_GROUP, CHARITY, PUBLIC_BODY), `OrgMemberRole`, `VerificationStatus` (UNVERIFIED, PENDING, VERIFIED, REJECTED), `ContentStatus` (DRAFT, PENDING_REVIEW, PUBLISHED, REJECTED, ARCHIVED, EXPIRED), `TrustLevel` (OFFICIAL, VERIFIED, COMMUNITY), `CategoryKind` (BUSINESS, EVENT, QUESTION, MARKETPLACE, JOB, ALERT, ORGANISATION), `UserStatus`, `ReportReasonV2`, `NotificationChannel`, `DigestFrequency` …

| Module | New models (key fields) |
|---|---|
| Users (extend) | `User` + `status`, `tokenVersion`, `emailVerifiedAt`, `homeLocationId`, `onboardingInterests[]`, `publicNameMode` |
| Roles | `Role`, `UserRole(userId, roleId, locationId?)` |
| Locations | `Location(type, name, slug, parentId, path, lat, lng, isCommunity, isLive, settings)` |
| Categories | `Category(kind, name, slug, parentId, icon, synonyms[], sortOrder, isActive, seoTitle, seoDescription)` |
| Organisations | `Organisation(type, name, slug, tagline, description, logo, cover, phone, email, website, socials, address…, postcode, lat, lng, showAddress, locationId, verificationStatus, status, claimedAt, charityNumber, companyNumber)`, `OrganisationMember`, `OrganisationCategory`, `OrganisationServiceArea`, `OpeningHours`, `SpecialHours`, `OrganisationService`, `OrganisationPhoto`, `OrganisationClaim` |
| Events | `Event(slug, title, description, startsAt, endsAt, allDay, venue, address, postcode, lat, lng, locationId, isOnline, imageUrl, categoryId, ticketUrl, priceInfo, contact*, organiserOrgId?, createdById, status, trustLevel, rrule?)` |
| Offers | `Offer(orgId, title, description, terms, badge, startsAt, endsAt, maxClaims, perUserLimit, redemptionMethod, url, status)`, `OfferClaim(offerId, userId, code, claimedAt, redeemedAt)` |
| Threads | `Thread(subjectType ENQUIRY/LISTING/VOLUNTEER, subjectId, orgId?, status)`, `ThreadParticipant`, `ThreadMessage` |
| Enquiries | `Enquiry(orgId, residentId, type, subject, status, threadId)` |
| Community | `CommunityQuestion(title, body, categoryId, locationId, authorId, status, moderation…)`, `CommunityAnswer(questionId, authorId, body, asOrgId?, recommendedOrgId?)`, `Recommendation(userId, orgId, body, sourceAnswerId?)` unique per user and org |
| Jobs | `Job(orgId, title, employmentType, salaryMin/Max/Text, locationId, description, applyUrl, applyEmail, closesAt, status)` |
| Volunteering | `VolunteerOpportunity(orgId, title, description, startsAt?, commitment, spaces, locationId, status)`, `VolunteerInterest(opportunityId, userId, message, status)`. `HelpRequest` is unchanged apart from optional `locationId` |
| Marketplace | `Listing(type FOR_SALE/FREE/WANTED, title, description, pricePence, condition, categoryId, images[], locationId, status, expiresAt, authorId)` |
| Alerts (extend) | `Alert` + `locationId?`, `categoryId?`, `trustLevel` (default OFFICIAL), `status` (default PUBLISHED), `submittedById?`, `sourceOrgId?`, `imageUrl?`. Existing rows stay published and official |
| Announcements | `Announcement(orgId, title, body, imageUrl, locationId, status, publishedAt)` |
| Trust / moderation | `ContentReport(targetType, targetId, reason, details, reporterId, status)`, `ModerationCase(targetType, targetId, kind REPORTED/AUTO_FLAGGED/NEW_CONTENT/VERIFICATION/CLAIM, status, locationId, assignedToId, resolution)`, `AuditLog` |
| Engagement | `Follow`-style `Following(userId, targetType ORGANISATION/CATEGORY/LOCATION, targetId)`, `SavedItem(userId, targetType, targetId)` |
| Feed / search | `FeedItem`, `SearchDocument` (+ raw-SQL GIN indexes, `pg_trgm`, later `vector`) |
| Notifications | `Notification`, `NotificationPreference`, `EmailOutbox`, `DeviceToken` |
| Billing / ads | `Plan`, `OrganisationSubscription`, `BillingCustomer`, `Payment`, `AdProduct`, `Promotion` |
| Analytics | `AnalyticsEvent`, `AnalyticsDaily` |
| Media | `MediaAsset` |
| Platform | `RateLimitBucket` |

Existing-data migration
- `isAdmin=true` → `super_admin` role.
- Every existing user gets `homeLocationId` = Burton Latimer.
- `COMPANY`/`CHARITY` users get a **DRAFT, non-public** Organisation pre-filled from their profile, and an in-app prompt to review and publish it. Nothing becomes public without their consent.
- Existing `Alert` rows are backfilled `trustLevel=OFFICIAL, status=PUBLISHED`.

Process: `0_init` baseline generated from the current schema → drift check against the *live* database (read-only), so the cut-over data copy lands on an identical schema → further migrations via `prisma migrate deploy`. Development happens on Neon child branches (`neon checkout dev-<feature> --create`), never directly on `production`.

## 7. Proposed API structure (`/api/v1`)

Conventions
- JSON; zod-validated.
- Errors: `{ error: { code, message, details? } }`.
- Cursor pagination: `?cursor=&limit=` returning `{ items, nextCursor }`.
- Auth by cookie or Bearer.
- Location context: `?community=burton-latimer`.
- Idempotent mutations where useful.

```
auth/        POST login | logout | register | verify-email | refresh(phase 5)     GET me
locations/   GET  /  /:slug
categories/  GET  ?kind=
search/      GET  ?q=&type=&community=&lat=&lng=&radius=&category=&openNow=&hasOffer=&verified=
feed/        GET  ?community=&cursor=
orgs/        GET  / (list)  /:slug   POST /   PATCH /:id   POST /:id/claim  /:id/photos  /:id/hours
             GET  /:id/analytics   /:id/enquiries   /:id/members
events/      GET  ?community=&range=today|week|weekend|month   /:slug   /:id/ics   POST  PATCH  DELETE
offers/      GET  ?community=  /:id   POST  PATCH   POST /:id/claim   POST /redeem (org, by code)
enquiries/   POST (resident → org)   GET mine   GET /:id   POST /:id/messages   PATCH /:id (status)
community/   questions  GET POST  /:id  /:id/answers POST   recommendations POST GET ?org=
jobs/  volunteering/  marketplace/  alerts/  announcements/     (same CRUD + list shape)
me/          saved  following  notifications (GET, PATCH read)  notification-preferences  onboarding
reports/     POST {targetType, targetId, reason, details}
billing/     GET plans   POST checkout   POST portal   POST webhook/stripe
promotions/  GET products   POST book (org)
media/       POST upload-token
admin/       users orgs verification categories locations moderation reports plans ad-products promotions analytics audit-log
cron/        (Vercel Cron, secret-protected) outbox  digests  analytics-rollup  expire-content
```
Existing `/api/*` routes stay in place (with security fixes) for the existing screens.

## 8. UI / UX plan

Design direction: a modern, warm, local hub, not Facebook, a council site or Yell.
- **Visual language**: keep the brand's gold accent and dark primary, and add a friendly secondary green ("local, growth"). Large rounded cards, generous whitespace, clear verification and "Sponsored" chips, photographic imagery of Burton Latimer.
- **Accessibility**: WCAG 2.2 AA. Honour the existing text size, high contrast, simple mode and reduced motion preferences across all new UI. Touch targets ≥ 44px.
- **Mobile shell** (`(app)` and public on small screens): bottom nav **Home · Discover · Events · Community · Profile**, plus a centre **＋** action sheet (Add business, Add event, Ask the community, Add offer (business), Volunteer, Sell/give away). The contents are filtered by role.
- **Desktop**: top bar with a prominent search, community switcher (hidden while one community exists), notifications and account.
- **Homepage** (`/`, SSR, data-driven):
  1. Hero: "What's happening around Burton Latimer?" + search with rotating examples.
  2. Important local info (published alerts, at most 2).
  3. What's On (horizontal event cards: Today / This weekend).
  4. Local Offers.
  5. Discover Local (category tiles).
  6. Community (open questions with an Answer CTA).
  7. Get Involved (volunteer opportunities + groups + link to help requests).
  8. Support Local (featured businesses, labelled Sponsored).
  9. Join CTA for logged-out visitors.
- **Business profile** (mobile-first): cover and logo, name, Verified chip, recommendation count, category, town, live "Open until 5pm". Sticky action bar with **Call · Website · Message · Directions**. Tabs or sections for About, Services, Offers, Events, Recommendations, Photos and Contact. JSON-LD `LocalBusiness`.
- **Directory / search**: a search bar with filter chips (Open now, Offers, Verified, Distance, Category) and list cards. Map view later.
- **Events**: segmented Today / This week / This weekend / This month. Event page with Add to calendar (.ics, Google, Outlook links).
- **Business onboarding wizard** (6 short steps): name → postcode (geocoded) → category → phone → website → description (optional "help me write this") → logo/photo. Creates a profile in *Unverified* state; verification is requested separately.
- **Resident onboarding**: a single screen of interest chips after registration, which drive the feed and notification defaults.
- **Business dashboard**: overview (views, clicks, enquiries this month), enquiries inbox, offers, events, jobs, profile editor, plan and billing.
- **Admin v2**: left nav (Users, Businesses, Organisations, Events, Offers, Community, Reports & Moderation, Advertising, Subscriptions, Locations, Categories, Analytics, Audit log), with queues showing counts.
- The **existing logged-in screens** (dashboard feed, groups, messages, help & support, wellbeing, alerts) remain reachable from the new shell and are restyled gradually.
- **PWA**: `app/manifest.ts`, icons (192/512/maskable from the existing logo), theme colour, standalone display. A small hand-written service worker for static asset caching and an offline fallback page (Serwist is not used because of its webpack requirement under Turbopack builds).
- **SEO**:
  - Pages: `/burton-latimer/businesses/plumbers`, `/business/abc-plumbing`, `/burton-latimer/events`, `/burton-latimer/groups`, `/organisation/{slug}`.
  - `generateMetadata` for title and description, Open Graph images, canonical URLs.
  - JSON-LD (`LocalBusiness`, `Event`, `Organization`, `JobPosting`, `BreadcrumbList`).
  - `sitemap.ts` (chunked) and `robots.ts`. The logged-in app, marketplace and resident content are `noindex`.

## 9. Implementation plan (small deployable stages)

Each stage passes: lint, typecheck, unit/integration tests, privacy tests, Playwright smoke (desktop + mobile viewport) including login and existing features, migration applied on a Neon branch, `next build`. Each ends in a deployable preview.

**Stage 0 – Foundations & safeguarding (no visible product change)**
- 0.1 Safeguarding fixes: anonymous authors never exposed; `/api/posts` requires auth and respects group membership; no emails or interests bulk-sent to clients; user search without email; server-side moderation in `POST /api/posts`; comments secret bug; remove secret fallbacks. *(Also offered as a hotfix for the live repo.)*
- 0.2 Dependencies: upgrade `next` to a patched 16.x (a release more than 7 days old), remove unused `next-auth` / `bcrypt` / neon adapter, add `jose` directly.
- 0.3 Prisma baseline migration + drift check + seed framework.
- 0.4 Vitest + Playwright + GitHub Actions. Clear the 42 existing lint errors so lint is a real gate.
- 0.5 Platform libs: env validation, session (cookie + Bearer, tokenVersion, status), `can()` permissions + roles tables, `withRoute` wrapper, rate limiter, audit log, public projections. Migrate the existing ~20 admin checks onto `requireRole`.

**Phase 1 – Core**
- Stage 1: Locations + roles data + `[community]` routing + new app shell/bottom nav + PWA manifest.
- Stage 2: Categories (admin CRUD, seeded list) + Organisations (business) + Vercel Blob media + onboarding wizard + claim/verification flow + public business profile (SEO/JSON-LD).
- Stage 3: Directory + search (SearchDocument, FTS, trigram, synonyms, open-now, distance/geocoding) + category landing pages + sitemap.
- Stage 4: Events (create/moderate, views, .ics/Google, event SEO).
- Stage 5: Offers + claims + redemption codes.
- Stage 6: Threads + business enquiries + notification core (in-app + email outbox + preferences).
- Stage 7: Favourites/following + resident onboarding + FeedItem + new homepage and "Around Burton Latimer".
- Stage 8: Admin v2 (users incl. suspend/roles, businesses, verification queue, unified moderation + ContentReport, categories, locations, audit log). **→ Candidate for switching the domain to the new app.**

**Phase 2 – Community**: 9 Ask the Community + recommendations (anti-manipulation rules) · 10 Organisation/group profiles + announcements · 11 Jobs · 12 Volunteer opportunities + "Get involved" hub (integrating existing help requests) · 13 Marketplace · 14 Local Alerts v2 (submission, moderation, trust labels, per-category preferences).

**Phase 3 – Commercial**: 15 Plans + entitlements + admin · 16 Stripe checkout/portal/webhooks · 17 Ad products + promotions + placement · 18 Business & platform analytics dashboards.

**Phase 4 – Intelligence**: AI provider, categorisation, event extraction, profile drafting, natural-language search (pgvector), personalised ranking, automated weekly digest.

**Phase 5 – Mobile**: PWA offline polish, web push, refresh tokens, OpenAPI docs generated from zod contracts, Expo app on `/api/v1`.

Deployment: new GitHub repo → new Vercel project → previews on Neon branches. The live project stays untouched and serves the domain until cut-over after Stage 8. It remains available as a rollback.

## 10. Decisions needed

1. **Live-site hotfix**: should findings 1–3 and 7 be patched in the *existing* repo now (a small, separate change you deploy), rather than waiting for the new platform?
2. **Help-request visibility**: proposal is that only INDIVIDUAL/CHARITY accounts (not businesses) see open requests, with first name only. Precise location is shown only to the accepted helper. Later, an optional `verified_volunteer` role (e.g. DBS-checked) for high-urgency requests.
3. **Direct messages**: stop businesses from starting DMs with residents (enquiry threads only)? Recommended: yes.
4. **Public resident content**: on logged-out pages, recommendations show "Sarah P."; Ask-the-Community threads and the marketplace are members-only. OK?
5. **Ratings**: the brief's example shows ★★★★★. Recommendation: launch with **recommendations** ("Recommended by 12 neighbours"), which are harder to game and friendlier for small businesses, and add star ratings later if wanted.
6. **Brand**: live site says "Burton Latimer Connect", the brief says "Latimer Community". Which name should the UI use, and what is the umbrella brand once Kettering etc. join?
7. **URL scheme**: `/burton-latimer/businesses/plumbers` (community-first) rather than `/businesses/plumbers/burton-latimer`. OK?
8. **New GitHub repo name** and whether I should create it (needs your GitHub auth) or you will.
9. **Geocoding**: use postcodes.io (free, UK, no key)?
10. **Rate limiting store**: Postgres (no new service) now, Upstash Redis later?
11. ~~Data region~~: resolved. The project was recreated in `aws-eu-west-2` (London), and image storage moved to Vercel Blob.
