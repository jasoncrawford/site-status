# Tech Spec: Site Status

## Overview

This document covers the technical architecture for the Site Status uptime monitoring app described in [SPEC.md](./SPEC.md). It focuses on framework choices, deployment, and the key technical challenges.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router, React) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password) |
| Real-time | Supabase Realtime (Postgres changes) |
| Hosting | Vercel |
| Scheduled checks | Vercel Cron Jobs |
| Email | Resend |

### Why this stack

**Next.js + Vercel** gives us server-side rendering for the public status page (good for SEO and fast first-load), API routes for backend logic, and Vercel Cron Jobs for the monitoring heartbeat -- all in one deployable unit with no separate server to manage.

**Supabase** provides Postgres, auth, and real-time subscriptions as managed services. Notably, Supabase Realtime lets us push live updates to the status/site/incident screens without polling or managing WebSocket infrastructure ourselves.

**Resend** is a simple transactional email API. It has a generous free tier and good deliverability.

## Architecture

```
┌──────────────────────────────────────────────────────┐
│  Vercel                                              │
│                                                      │
│  ┌──────────────┐   ┌─────────────────────────────┐  │
│  │  Next.js App  │   │  Cron Job (every 5 min)     │  │
│  │  - Pages/UI   │   │  POST /api/checks/run       │  │
│  │  - API Routes │   └──────────┬──────────────────┘  │
│  └──────┬───────┘              │                     │
│         │                      │                     │
└─────────┼──────────────────────┼─────────────────────┘
          │                      │
          ▼                      ▼
┌──────────────────┐   ┌──────────────────┐
│  Supabase        │   │  Resend          │
│  - Postgres DB   │   │  (email alerts)  │
│  - Auth          │   └──────────────────┘
│  - Realtime      │
└──────────────────┘
```

### Request flow

1. **Public visitors** load the Next.js pages, which fetch data from Supabase via server components. The client subscribes to Supabase Realtime for live updates.
2. **Logged-in users** get the same pages plus authenticated API routes for mutations (add/edit/delete sites, manage contacts, resolve incidents, invite users).
3. **Every 5 minutes**, Vercel Cron triggers the check endpoint, which runs all site checks and records results.

## Database Schema

```
sites
  id          uuid PK
  name        text
  url         text
  created_at  timestamptz

checks
  id          uuid PK
  site_id     uuid FK → sites
  status      text        -- 'success' | 'failure'
  status_code int         -- HTTP status code, null on connection failure
  error       text        -- error message for failures
  checked_at  timestamptz

incidents
  id          uuid PK
  site_id     uuid FK → sites
  check_id    uuid FK → checks  -- the check that triggered this incident
  status      text              -- 'open' | 'resolved'
  opened_at   timestamptz
  resolved_at timestamptz

contacts
  id          uuid PK
  email       text UNIQUE
  created_at  timestamptz

users (managed by Supabase Auth)
  -- Supabase provides: id, email, created_at, etc.

invitations
  id          uuid PK
  email       text
  invited_by  uuid FK → auth.users
  token       text UNIQUE
  accepted_at timestamptz
  created_at  timestamptz
```

### Row-Level Security

Supabase RLS policies will enforce:
- **Public read**: `sites`, `checks`, `incidents` are readable by everyone (the status page is public).
- **Authenticated write**: Only logged-in users can insert/update/delete sites, contacts, incidents, and invitations.
- Contacts are only visible to authenticated users (the settings page is auth-only).

## Key Technical Challenges

### 1. Scheduled Monitoring (the heartbeat)

The core loop: every 5 minutes, check every site URL.

**Approach:** A Vercel Cron Job calls `POST /api/checks/run`. This API route:

1. Fetches all sites from the database.
2. Makes an HTTP request to each site's URL (in parallel, with a timeout).
3. Records a `checks` row for each result.
4. For each failure: checks whether the site already has an open incident. If not, creates one and sends alert emails.

**Configuration:** In `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/checks/run",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**Security:** The cron endpoint verifies the `Authorization` header contains the `CRON_SECRET` that Vercel automatically sends, so it can't be triggered externally.

**Timeouts and parallelism:** Each HTTP check uses a 30-second timeout. All checks run concurrently via `Promise.allSettled`. Vercel serverless functions have a default 10-second timeout; we'll configure this route to allow up to 60 seconds (available on the Pro plan) or 300 seconds on the Enterprise plan. For the MVP's expected number of sites (under a dozen), this is more than sufficient.

**SSL validation:** Node's `fetch` (or `https` module) validates SSL certificates by default. A certificate error will cause the request to fail, which is the behavior we want -- it counts as a check failure.

### 2. Real-Time Updates

The spec requires that the status, site, and incident screens update live without the user refreshing.

**Approach:** Use Supabase Realtime to subscribe to Postgres changes on the `checks`, `incidents`, and `sites` tables. When the cron job writes new check results or opens an incident, Supabase pushes those changes to all connected clients.

On the client side, a React hook subscribes to the relevant tables on mount and updates local state when changes arrive. This works for all three live screens:
- **Status page:** Subscribes to `checks` (latest status per site) and `incidents` (open incidents list).
- **Site detail:** Subscribes to `checks` for that site and `incidents` for that site.
- **Incident detail:** Subscribes to `checks` for that site (to show ongoing check results) and `incidents` (to reflect resolution).

**Supabase Realtime setup:** Realtime must be enabled per-table in the Supabase dashboard (it's off by default). We'll enable it for `checks`, `incidents`, and `sites`.

### 3. Authentication and Invitations

The app uses invite-only auth. There is no public signup.

**Flow:**
1. The first user is created via the Supabase dashboard or a seed script.
2. Existing users can invite new users by email from the Settings screen.
3. The app sends an invitation email (via Resend) with a unique token link.
4. The invited user clicks the link, sets a password, and their account is created.
5. Login is email/password via Supabase Auth.

**Session management:** Supabase Auth uses JWTs stored in an HTTP-only cookie (via the `@supabase/ssr` package). The Next.js middleware checks the session on protected routes and API endpoints.

### 4. Email Notifications

When an incident is opened, all contacts receive an email.

**Implementation:** The check-runner API route, after opening a new incident, fetches all contacts and calls the Resend API to send an alert email to each. The email includes:
- Which site is down
- What error was detected (e.g., "HTTP 503", "Connection timeout", "SSL certificate invalid")
- A link to the incident detail page

**Rate limits:** Resend's free tier allows 100 emails/day, which is well within MVP needs. If more volume is needed, their paid tier is inexpensive.

## Pages and Routing

| Route | Description | Auth required |
|---|---|---|
| `/` | Status page (open incidents + sites grid) | No |
| `/sites/[id]` | Site detail (incidents + check log) | No |
| `/incidents/[id]` | Incident detail (status + checks since opened) | No |
| `/settings` | Contacts + users management | Yes |
| `/login` | Login form | No |
| `/invite/[token]` | Accept invitation / set password | No |

## Deployment

**Vercel** handles deployment via Git push. The setup:

1. Connect the GitHub repo to Vercel.
2. Set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` -- Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` -- Supabase public/anon key
   - `SUPABASE_SERVICE_ROLE_KEY` -- for server-side operations (check runner, sending invites)
   - `RESEND_API_KEY` -- for sending email
   - `CRON_SECRET` -- auto-provided by Vercel for cron auth
3. Vercel Cron is configured via `vercel.json` and starts running automatically on deploy.

**Supabase** is provisioned separately. Database migrations will be managed with the Supabase CLI (`supabase migration`), which generates SQL migration files that live in the repo.

**Environments:** For the MVP, a single Supabase project (free tier) and a single Vercel project (Pro plan, for cron jobs) are sufficient. A staging environment can be added later if needed.

## Data Retention

The `checks` table will grow by `number_of_sites * 288` rows per day (one check every 5 minutes = 288/day per site). For 10 sites, that's ~2,880 rows/day or ~1M rows/year.

For the MVP, this is fine -- Postgres handles this volume easily. A future improvement could add a retention policy (e.g., delete checks older than 90 days), but this is not needed at launch.

## Testing Strategy

All layers of the app have automated regression tests. Manual testing is reserved for initial user acceptance only.

**Test runner:** Vitest for unit and integration tests. Playwright for end-to-end browser tests.

**Local Supabase:** All tests that touch the database run against a local Supabase instance (`supabase start`), so tests are fast, isolated, and don't require a network connection.

### Unit tests

- Check-runner logic: HTTP checks, timeout handling, SSL validation, status code classification.
- Incident logic: opening an incident on failure, deduplication (no new incident when one is already open), resolving.
- Email construction: correct recipients, correct content for each failure type.

### Integration tests (API routes)

- CRUD operations for sites, contacts, and invitations.
- The full check-run cycle: seed sites, call the check-runner endpoint, verify that checks are recorded, incidents are opened/deduplicated, and email is sent (using a mock or captured Resend call).
- Auth: protected routes reject unauthenticated requests, login flow works, invitation acceptance creates a user.
- RLS policies: verify that anonymous users can read public data but cannot write, and that authenticated users can write.

### End-to-end tests (Playwright)

- **Status page:** Loads, displays sites and open incidents, links to detail pages.
- **Site detail:** Displays check log and incident history.
- **Incident detail:** Shows incident info, resolve button works for logged-in users.
- **Settings:** Add/remove contacts, invite users (behind auth).
- **Login:** Full login/logout flow.
- **Real-time updates:** A test triggers a check run (via API call) and asserts that the status page updates without a manual refresh.

### CI

Tests run on every push via GitHub Actions. The CI workflow:

1. Starts a local Supabase instance (`supabase start`).
2. Runs database migrations.
3. Runs Vitest (unit + integration).
4. Runs Playwright (end-to-end).

Deployments to Vercel only proceed if all tests pass.
