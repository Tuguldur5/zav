# Зав байна — Progress

## SESSION 10 (2026-10-27) — FIX-1 Q0: measure first (no behaviour change)

**Done: Q0 (verified twice, second time on a fresh build with no source change).
Next: Q1 — remove avoidable network work on the public pages.**

### Added

- `scripts/perf-routes.mjs` (`npm run perf`): against `http://127.0.0.1:3000`, one
  warm-up request per route is discarded, then 6 anonymous GETs with `Host` and
  `X-Forwarded-Host` from `NEXT_PUBLIC_SITE_HOST` / `_WORKER_` / `_STAFF_` in
  `.env.local`. Prints median and p95 TTFB and total, status and a verdict;
  budget median < 400 ms and p95 < 1000 ms on both TTFB and total; exit 1 on
  FAIL. Only host names are printed, never other env values.
- `src/lib/perf.ts` + `PERF_LOG=1` logs: one `[perf]` line per middleware request
  (`path`, `method`, `ms`, `auth_ms`, `status`; early 404/429 exits included) and
  one line per server-side Supabase call (`scope=server kind=auth|db path=<pathname>
  ms=<n> status=<n>`). No cookies, ids, emails or query strings are logged.
  Example: `[perf] scope=middleware path=/ method=GET ms=2 auth_ms=2 status=200`,
  `[perf] scope=server kind=db path=/rest/v1/skills ms=113 status=200`.
- `next.config.ts`: `output` is `standalone` only when `NEXT_OUTPUT=standalone`
  (the Dockerfile build stage sets it). `npm start` no longer prints the
  standalone warning; `npm run start:standalone` still works after such a build.
  README 7.2 and 8 updated for the opt-in flag.
- `eslint.config.mjs`: ignore the leftover `.next-slots-check/**` verification
  build dir. `npm run lint` was failing on 8,956 generated-file findings before
  any source change; with the ignore it reports only the 2 pre-existing unused
  `eslint-disable` warnings in `src/lib/auth.ts`.

### Baseline — production build, `next start`, PERF_LOG unset (Node 20.18)

| route | host | status | TTFB med | TTFB p95 | total med | total p95 |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | zav.localhost:3000 | 200 | 304 | 368 | 331 | 400 |
| `/login` | zav.localhost:3000 | 200 | 45 | 61 | 52 | 67 |
| `/register` | zav.localhost:3000 | 200 | 43 | 51 | 51 | 60 |
| `/forgot-password` | zav.localhost:3000 | 200 | 39 | 45 | 48 | 53 |
| `/terms` | zav.localhost:3000 | 200 | 186 | 300 | 199 | 319 |
| `/` | ajil.zav.localhost:3000 | 200 | 274 | 346 | 294 | 361 |
| `/login` | ajil.zav.localhost:3000 | 200 | 47 | 51 | 57 | 62 |
| `/register` | ajil.zav.localhost:3000 | 200 | 256 | 260 | 262 | 266 |
| `/forgot-password` | ajil.zav.localhost:3000 | 200 | 38 | 42 | 43 | 49 |
| `/login` | admin.zav.localhost:3000 | 200 | 40 | 46 | 46 | 51 |

Verdict of this run: **PASS**, but the margin is thin. Repeated runs on the same
build gave customer `/` 405/583/437 ms (FAIL), 303 ms and 304 ms, and worker `/`
377, 369 and 274 ms, so a single run is not a verdict — the landings sit on the
400 ms budget. Staff `/login` and the form-only pages are stable at 38–57 ms.

### Diagnosis (5 lines)

1. Each landing makes 5 Supabase round-trips: `skills` answers **HTTP 400**
   (code 42703 — `skills.sensitive` does not exist, so `db/09_skills.sql` is not
   applied), then the legacy `skills` query runs sequentially, plus `districts`,
   `settings/support_phone` and `settings/support_text`.
2. Those calls cost 100–370 ms each from this machine (PERF_LOG), and nothing is
   cached: that is essentially the whole 274–331 ms of both landings.
3. Middleware is not the bottleneck — 1–8 ms per anonymous request including
   `auth_ms` — but it still builds a cookie-bound Supabase client on every
   request; `getUser()` skips the network when no `sb-` cookie is present.
4. Worker `/register` (256 ms) fetches districts + public skills (3 calls with the
   fallback), while customer `/register` (43 ms) does not; `/terms` spends
   145–186 ms on `getSupportPhone()` alone.
5. Routes without data access are already inside budget (`/login` 45–47 ms,
   `/forgot-password` 38–43 ms, staff `/login` 40 ms): a cached catalog/settings
   layer (Q1) is the lever, not middleware tuning.

### Checks (Q0)

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | PASS |
| `npm run lint` | PASS (2 pre-existing warnings in `src/lib/auth.ts`) |
| `npm run build` | PASS (Next 15.5.28) |
| `npm start` standalone warning | GONE (`NEXT_OUTPUT=standalone` opt-in) |
| `npm run perf` | 1 FAIL then 2 PASS runs — see variance note above |

No UI change in this phase. Staff screens untouched.

### Q0 re-check on a fresh build (second pass, no source change)

Same tree, new `npm run build` and one `npm start` (port 3000, no other node
process). `npx tsc --noEmit` and `npm run lint` PASS again (same 2 warnings).
Two `npm run perf` runs, both **PASS**:

| route | host | status | TTFB med | TTFB p95 | total med | total p95 |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | zav.localhost:3000 | 200 | 282 / 280 | 327 / 440 | 302 / 297 | 344 / 457 |
| `/login` | zav.localhost:3000 | 200 | 27 / 38 | 47 / 39 | 31 / 43 | 52 / 44 |
| `/register` | zav.localhost:3000 | 200 | 28 / 33 | 41 / 38 | 33 / 38 | 52 / 43 |
| `/forgot-password` | zav.localhost:3000 | 200 | 26 / 28 | 45 / 37 | 30 / 34 | 51 / 41 |
| `/terms` | zav.localhost:3000 | 200 | 138 / 145 | 164 / 155 | 144 / 156 | 172 / 168 |
| `/` | ajil.zav.localhost:3000 | 200 | 343 / 276 | 655 / 281 | 355 / 293 | 667 / 305 |
| `/login` | ajil.zav.localhost:3000 | 200 | 22 / 37 | 31 / 45 | 25 / 42 | 35 / 50 |
| `/register` | ajil.zav.localhost:3000 | 200 | 248 / 258 | 261 / 269 | 258 / 265 | 270 / 274 |
| `/forgot-password` | ajil.zav.localhost:3000 | 200 | 23 / 33 | 37 / 37 | 29 / 37 | 42 / 42 |
| `/login` | admin.zav.localhost:3000 | 200 | 33 / 49 | 43 / 59 | 38 / 57 | 49 / 68 |

(Values are `run 1 / run 2`.) The picture is unchanged: the landings and worker
`/register` are inside budget but only just, and one worker `/` p95 hit 655/667 ms.
Nothing in this pass changed behaviour, so the Q1 targets stand.

`PERF_LOG=1` spot check on the same build (one anonymous customer `/` request):

```
[perf] scope=middleware path=/ method=GET ms=27 auth_ms=19 status=200
[perf] scope=server kind=db path=/rest/v1/districts ms=297 status=200
[perf] scope=server kind=db path=/rest/v1/settings ms=300 status=200
[perf] scope=server kind=db path=/rest/v1/skills ms=499 status=400
[perf] scope=server kind=db path=/rest/v1/settings ms=315 status=200
[perf] scope=server kind=db path=/rest/v1/skills ms=199 status=200
```

This confirms diagnosis 1–2 line by line: the first `skills` query still fails
with 400 (`skills.sensitive` missing), the legacy retry is sequential, and the
five calls dominate the response; middleware is 27 ms of 2.37 s. `/terms` on the
same build logged a 4 ms middleware line and one 200 ms `settings` call.

## SESSION 9 (2026-10-26) — Slots redesign

### D0 — Detect, brief, cleanup

- Initial baseline: `npx tsc --noEmit` PASS; `npm run lint` PASS with two
  pre-existing unused `eslint-disable` warnings in `src/lib/auth.ts`.
- Git is available; created the `pre-redesign` tag. The working tree was
  already extensively modified before this task. Preserve all pre-existing
  changes and do not reset or restore files.
- Dev server: use `npm run dev` while editing. `npm start` serves the last
  production build and may be stale; do not use it for visual verification.
  `.next` exists, but it has not been established as stale.
- The installed Next package does not include `node_modules/next/dist/docs/`.
  Consulted the Next 15 `next/font` guide instead; variable font weights can
  omit `weight`, and requested subsets are self-hosted at build time.
- `docs/DESIGN.md` records the Slots system and acceptance criteria.
- Confirm with owner before publishing answers about payment, no-show handling,
  and minimum worker age. Do not invent policy.
- Current phase: D0 is in progress.

Next: D0 step 2 — public-surface cleanup and dev-only design page.

## SESSION 8 (2026-10-25) — auth fix (F1-F3), deploy path, QA truth pass

### STATUS

1. Baseline at detection: `npx tsc --noEmit` PASS, `npm run lint` PASS, `npm run build` PASS (Next 15.5.28, Node 20 on this machine).
2. F1 root cause: a stale `sb-*-auth-token` cookie makes `auth.getUser()` throw from the middleware and from every page/action; nothing catches it.
3. Reset is broken on all three hosts: the email link used the PKCE `code` flow on `/auth/callback`, which needs the same browser's code-verifier cookie. `forgot-password` also sent `?next=` inside `redirectTo`.
4. No `/auth/confirm` route existed anywhere; the staff middleware 404s every `/auth/*` path except `/auth/callback`.
5. `/reset-password` redirected anonymous visitors to `/login` instead of explaining that the link expired.
6. Fixed: `readSession()` + `getCurrentUser()`, shared `token_hash` confirm handler on all three hosts, host-derived `redirectTo`, GET link endpoints rate-limited, POST auth 5/min.
7. Reset is now scoped to the link: `/auth/confirm?type=recovery` sets a 15-minute
   httpOnly `zav_recovery` cookie, and both `/reset-password` and `resetAction`
   require it. A session left open on a shared phone can no longer set a new
   password without the mailed link. `/login?reset=1` confirms the change and
   `/forgot-password?error=link` explains an expired or reused link.
8. Deploy path: `Dockerfile` builds and runs on `node:22-alpine` and now passes
   `NEXT_PUBLIC_WORKER_HOST` and `NEXT_PUBLIC_VAPID_PUBLIC_KEY` as build args
   (both were missing, so a Docker build shipped `*.localhost` worker links and
   no push key). Added `engines.node >= 20.18`, `.nvmrc` (22) and
   `npm run start:standalone`; `output: "standalone"` stays on unless Vercel
   builds, so local `npm start` still prints Next's standalone warning (harmless,
   documented in README 7.2).
9. Landings: both public hosts already had complete landings, which the smoke
   checks confirm; they were kept as they are. The draft marketing dictionary
   (`src/lib/i18n/mn.marketing.ts`) and `src/components/marketing/Section.tsx`
   were never imported and were deleted instead of shipping unused copy. No
   `check:landing` script was added — `npm run smoke` already asserts the
   landing H1, the worker cross-link and the registration purpose line.
10. QA: `npm run check:auth` (new), `npm run smoke` gained an email-link block
   for all three hosts, `robots.txt`/`sitemap.xml` now pass through the
   middleware (they were 404ing behind the audience rewrite), and `/privacy`
   no longer overflows a 360px phone (`grid-cols-1` + a table that fits).
11. `npm run verify` could NOT run: the stored `DATABASE_URL` password is still
   rejected (28P01), same block as session 7. Everything that does not need the
   database was run — see the acceptance table below.

### Auth fix (F1 — diagnosis, evidence from the repo)

| # | Hypothesis | Verdict | Evidence in the code at detection |
| --- | --- | --- | --- |
| H1 | `getUser()`/`getSession()` is called without catching the stale-cookie error | **YES** | `src/middleware.ts` line 178 `await supabase.auth.getUser()` with no try/catch; the same call appears in `src/lib/auth.ts` (3x), `auth-callback.ts`, 12 action files. A cookie for a deleted user (verify/cleanup fixtures) throws `AuthApiError: Invalid Refresh Token: Refresh Token Not Found` on every request. |
| H2 | `resetPasswordForEmail` gets a wrong or hard-coded `redirectTo` | **YES** | `forgotAction` sent ``${currentOrigin()}/auth/callback?next=/reset-password``. `currentOrigin()` trusts the request host (no allow-list) and defaults the scheme to `http`; the query string also collides with the template's own `?token_hash=…`. |
| H3 | Reset relies on the PKCE `code` flow | **YES** | `/auth/callback` only calls `exchangeCodeForSession(code)`. The verifier lives in a cookie of the browser that requested the reset, so opening the mail in another browser/device (or a different host) always fails. |
| H4 | forgot/reset/confirm/callback missing or not rewritten per host | **PARTLY** | `/forgot-password`, `/reset-password` and `/auth/callback` exist on all three hosts, but **`/auth/confirm` did not exist anywhere**, and the staff middleware returned 404 for every `/auth/*` path except `/auth/callback`. |
| H5 | Middleware blocks or hijacks the auth paths | **PARTLY** | The staff host blocked `/auth/*` (H4). `/reset-password` itself redirected anonymous visitors to `/login` (`if (!user) redirect("/login")`), so the expired-link message never appeared. GET `/auth/confirm`/`/auth/callback` had no rate limit (POST login/register/forgot had 5/min). There is no logged-in redirect-away inside the middleware; that lives in the login screens, which `/forgot-password` and `/reset-password` never rendered. |
| H6 | Build-time host env values differ from `.env.local` | **NO (local)** | `next.config.ts` sets `output: "standalone"` unconditionally, which is what produced the `next start` warning. `.env.local` and the build use the same three `*.localhost:3000` hosts, and `NEXT_PUBLIC_*` values are inlined at build time as documented (no mismatch found). |

### Acceptance (session 8, `next start` on the production build)

| Criterion | Result |
| --- | --- |
| `npx tsc --noEmit` / `npm run lint` | PASS |
| `npm run build` | PASS (Next 15.5.28, Node 20.18 local) |
| `npm run check:auth` | PASS — 56 checks, all three hosts (static + HTTP) |
| `npm run smoke` | PASS |
| `npm run contrast` | PASS — both staff tones, all pairs |
| `npm run backdrop` | PASS — 10 page/width combos (staff pages need auth) |
| `npm run layout` | PASS — 7 widths × 3 hosts, no overflow |
| `npm run verify` | NOT RUN — DB password rejected (28P01) |
| Anonymous `/reset-password` on every host | 307 → `/forgot-password?error=link` |
| Tokenless `/auth/confirm` on every host | 307 → `/login?error=link` (never 500) |
| Expired recovery link | 307 → `/forgot-password?error=link` |
| Bad `/auth/callback?code=` | 307 → `/login?error=auth` (never 500) |
| `/robots.txt` | 200 per host (customer `Disallow: /c`, worker/staff `Disallow: /`) |
| `/sitemap.xml` | 200, host-specific URLs |
| `/privacy` at 360/390px | PASS — was 176px/146px overflow, now 0 |

Still open (needs the database): `db:apply`, `fixtures:clean`, `verify` (twice),
and an authenticated pass of `layout`/`backdrop` on the staff pages.

Still open (needs the Supabase dashboard): the email templates must link with
`{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=…`. Until they do, Supabase's
default `{{ .ConfirmationURL }}` sends the visitor through `/verify` and the
session arrives in the URL fragment, which no server route can read — the table
is in README 7.4.

**Root cause of the reset failure:** the recovery email linked to the PKCE code flow
(`/auth/callback?code=…`). The code verifier is a cookie in the browser that asked for
the reset, so any other browser, device or host fails the exchange — and the failure was
reported as a generic login error. On top of that the `redirectTo` was built from the raw
request host with a query string, and no `token_hash` handler existed. The fix links to
`<configured host origin>/auth/confirm`, which verifies `token_hash` with no cookie at all.

## SESSION 7 (2026-10-21) — Staff UI v2: white shell, teal accent, routing fix

### STATUS

1. Baseline: `npx tsc --noEmit` PASS, `npm run lint` PASS, `npm run build` PASS
   (after the rewrite below). Old chrome removed; new shell wired for both roles.
2. P0 scripts written: `scripts/staff-audit.mjs`, `scripts/cleanup-fixtures.mjs`,
   `db/05_admin_loads.sql` (admin_loads + fixture staff-role repair + grant guard).
   **BLOCKED**: the database is unreachable from this machine — the stored
   `DATABASE_URL` password is rejected (28P01) and the direct host is IPv6-only
   which now times out. `db:apply`, `staff:audit`, fixture cleanup and `verify`
   could not run. Nothing was applied; no secrets printed.
3. Decisions: `/security` stays outside the shell (it is the MFA gate and must
   load at aal1); `/profile` and `/notifications` moved to `(shared)` and pick
   the shell by ROLE. Super opening an admin route is redirected in the admin
   layout before the shell renders. The shell also sets `data-staff-tone` on its
   root, so shared pages get the super tone even though middleware only sees the
   path.
4. Admin load comes only from `admin_loads()`; bars scale by
   `settings.admin_capacity` (default 10), never by the largest row.
5. Links: new `npm run check:links` PASS. Removed the super dashboard link to
   `/jobs/[id]` (now /super-only) and the super jobs row link (no super detail
   page). Notification links are still produced by RPCs; they are relative app
   paths and the bell/notification list only navigates to them.
6. Deleted: AdminDesk, CommandPalette, Dock, FloatingRail, QueueCard, TabNav,
   StaffHeader, PageHeader(old), StatTile(old), SegmentedTabs(old), ProfileMenu,
   jobs/JobCard, lib/staff-desk, and all `--adm-*` tokens/CSS.
7. Demo seed: `scripts/seed-demo.mjs` (+ Mongolian README section). Cannot be
   run without the database credentials; it refuses unless `ALLOW_DEMO_SEED=1`.
8. QA: `npm run contrast` PASS (both tones), `npm run check:links` PASS,
   `npm run layout` PASS, `npm run backdrop` PASS (8 page/width combos),
   tsc/lint/build PASS. Authenticated staff pages could not be rendered
   (no session possible while the DB password is rejected), so layout ran on
   public + staff login and skipped auth routes.
9. Next: restore DB credentials, then `npm run db:apply`, `npm run fixtures:clean`,
   `npm run verify` twice, `npm run layout`, `npm run backdrop`.
10. Manual test checklist (6 lines): super header, profile menu, bell, each super
    tab, admin tabs, phone width tab bar — see the end of this section.

### P0 findings (from scripts/staff-audit.mjs — NOT executed, DB blocked)

- The fixture pattern is `verify-<runId>-<code>@example.test` + names "Verify …".
- The old super/admins page read load from `staff_directory()` while the
  dashboard read `stats()->admins_load`; two queries, two answers. Root cause of
  duplicate/non-admin rows: ad-hoc joins to `worker_details` (one row per
  worker) in the dashboard-side queries. Fixed by `admin_loads()` — a single
  grouped query (one row per active admin) used by the dashboard, intake, admins
  and jobs pages.
- `db/05_admin_loads.sql` also demotes any profile whose auth email matches the
  fixture pattern but still holds a staff role (idempotent), and adds
  `profiles_staff_role_guard` so only a super/owner can grant a staff role.
- `npm run staff:audit` output before/after: **unavailable** (connection error);
  the script prints masked emails only.

### Link audit (super files → super only; admin files → admin only)

| Source | Target | Role | Verdict |
| --- | --- | --- | --- |
| super/page.tsx | /super/intake, /super/admins, /super/jobs?tab=unclaimed | super | ok |
| super/intake/IntakeClient.tsx | /super/workers?q=… | super | ok |
| super/jobs/page.tsx | /super | super | ok |
| admin/today/page.tsx | /jobs, /workers, /calendar, tel: | admin | ok |
| admin/jobs/page.tsx | /jobs/[id], /today | admin | ok |
| admin/jobs/[id]/page.tsx | /jobs?tab=mine, /workers/[id] | admin | ok |
| admin/workers/[id]/page.tsx | /workers, /calendar | admin | ok |
| components/staff/StaffShell.tsx | role home (/today or /super), /profile, /security, /notifications | both | ok |
| (removed) super/page.tsx | /jobs/[id] | super | fixed → /super/jobs?tab=unclaimed |
| (removed) super/jobs/page.tsx | /super/jobs/[id] (did not exist) | super | fixed → no row link |


## SESSION 6 (2026-10-20) — staff redesign: blue "Control Center" shell

### Staff redesign STATUS (step 0 detection)

1. Existing pages at detection time (all present, none missing, none stubbed):
   admin `/today`, `/jobs`, `/jobs/[id]`, `/workers`, `/workers/[id]`,
   `/calendar`, `/notifications`; super `/super`, `/super/intake`,
   `/super/admins`, `/super/workers`, `/super/jobs`, `/super/catalog`,
   `/super/settings`, `/super/audit` (+ `/audit/export`); staff `/login`,
   `/security`, `/join`. Missing then: **`/profile` (both staff roles)** — built
   this session, and **`/__kit/staff`** (component gallery) — built this session.
2. Shell at detection: both layouts already mounted `StaffFrame` -> old
   `StaffShell` (`.staff-frame` + `Panel` + `ToolPill`), and `<html>` had
   `data-audience`/`data-tone` but no `staff-theme` class and no
   `data-staff-tone`; the token block was `html[data-audience="staff"]` with
   `#075985` frame and a radial-gradient on the body.
3. Baseline before the redesign: `npx tsc --noEmit` PASS, `npm run lint` PASS
   (1 warning: unused `profile` in `workers/[id]`), `npm run build` PASS.
4. Old shell files **deleted**: `src/components/app/AdminFrame.tsx`,
   `src/components/app/StaffChip.tsx`, `src/components/staff/{Panel,ToolPill,
   AccountChip,HeaderNav,DeskPanel,DeskItem}.tsx`; `AdminRail`/`SuperRail`
   removed from `src/components/app/navs.tsx`.
5. Tokens: `.staff-theme` + `data-staff-tone="admin|super"` on `<html>`
   (server-rendered from the middleware path header) hold every `--adm-*`
   colour; the body gradient rule is gone and `html[data-audience="staff"] body`
   is a flat `var(--adm-frame)`. No raw hex outside that block.
6. Shell: `.staff-app` (100dvh, 1760px, 12px padding) = `StaffHeader` +
   `.paper` (28px radius, 96x8 notch, grid `64 / 1fr / 360`) + `Dock`; main and
   aside scroll independently; `FloatingRail` is absolutely placed in the rail.
7. Next: A7 — `npm run build`, `npm run verify`, `npm run layout` finishing,
   `npm run contrast`/`backdrop` re-run on a production build, then the
   acceptance table.


## SESSION 5 (2026-10-19) — staff redesign (blue frame shell)

### Staff design debug (STEP 1 — measured before any fix)

Server measured: `next start` on PID 3432, `.next/BUILD_ID` = `bBe7VMgFJNHYfeNst1TvL`
(stale build, older than the current sources). Results (`Host:
admin.zav.localhost:3000`, loopback):

1. HTTP: `/` → 307 `/login`, `/login` → 200, `/today` → 307 `/login`,
   `/super` → 307 `/login`, `/security` → 307 `/login`. Host routing and the
   unauthenticated redirect chain are correct; no fall-through to the user
   host.
2. `/login` HTML: `<html lang="mn" data-audience="staff"
class="__variable_ce203d">` — **`data-tone` missing**, **`data-staff-panel`
count = 0**, no `staff-frame/staff-header/staff-dock/staff-tools` markers,
   one stylesheet `/_next/static/css/e6827340f5426a7d.css`.
3. `middleware.ts` + `hosts.ts`: exact host match, staff host rewrites to
   `/staff/*`; `.env.local` `NEXT_PUBLIC_SITE_HOST`/`NEXT_PUBLIC_STAFF_HOST`
   both match `zav.localhost:3000` / `admin.zav.localhost:3000` (checked
   programmatically, values not printed). `Cache-Control` for staff HTML is
   `private, no-cache, no-store` — not a browser-cache problem, no `.next`
   reinstall needed (a rebuild was required instead).
4. Layouts: `src/app/staff/(admin)/layout.tsx` and `(super)/layout.tsx` both
   render the OLD `AdminFrame` (sidebar + rail + `TopAppBar` + `StaffChip`);
   nothing imports `src/components/staff/*`. The new kit existed on disk but
   was never wired; old staff CSS (`--bg` body, `[data-staff-nav]` sidebar
   rules) still painted the near-white page. `data-audience` is set
   server-side in `src/app/layout.tsx`, but `data-tone` was not set anywhere;
   `/security`, `/login`, `/join` bypass any shell with their own markup.
5. `git`: single initial commit; every app file is untracked/modified, so the
   previous session's shell work was never committed — nothing to revert.

**Root cause:** the redesign was built as components only — the staff layouts
still mounted the old sidebar shell, `data-tone` was never rendered, and the
server was running a stale production build.

## SESSION 4 (2026-10-19) — visual design fix

### Design fix (root cause)

The "visual system v2" never painted anything because there was no backdrop to
paint: `src/app/globals.css` set `body { background: var(--bg) }` (#F8FAFC) and
nothing else. A grep for `Backdrop`, `fixed inset-0`, `z-[-1]`, `-z-10` and
`background-attachment` finds only the dialog/drawer/sheet overlays — no
background element exists in the repo. On top of that, every wrapper between
`<body>` and the page content painted the same flat colour (`LandingPage` and
`AuthShell` roots and `AppShell` all used `min-h-dvh bg-bg`), and `data-audience`
was only ever set on an inner `<div>`, never on `<html>` — so even an audience
rule in CSS could not match. The result on `/` was one flat near-white plane with
no gradient, glow or separation between bands.

### What changed

- The backdrop is now painted on `<body>` from `globals.css` (4 radial glows +
  a sky-to-white linear gradient, 5 gradients total); there is no fixed layer.
  `#F4FAFF` is the base, values are the required strength, not weakened.
- `middleware.ts` puts `x-zav-audience` on the rewritten request and the root
  layout reads it with `headers()`, so `<html data-audience="public|staff">`
  is in the first byte of HTML (verified over curl, no flash, no client JS).
- Removed every opaque wrapper: `LandingPage`, `AuthShell`, `AppShell`, help
  and staff security roots no longer use `min-h-dvh bg-bg`. Only cards, bars
  and dialogs are opaque.
- Landing rebuilt: 12-column hero (copy + option cards + trust chips left,
  `HeroArt` right), 72/40px section rhythm, white how-it-works band with a
  connector line, transparent safeguards band, wave + tinted support band,
  minimal footer. Phone header is logo + login only.
- New `src/components/art/`: `HeroArt` (rendered SVG 3.4 KB), `StepIcons`,
  `WaveDivider`, `AuthArt`, `EmptyJobs`, `EmptyCalendar`, `EmptyOffers`,
  `EmptyWorkers`. `EmptyState` accepts `art`.
- Auth uses a 480px form card plus a tinted `AuthArt` panel from 1024px; the
  customer/worker homes start with a gradient greeting card and use small
  uppercase section labels.
- `scripts/check-backdrop.mjs` + `npm run backdrop`; `check-contrast.mjs` now
  samples the rendered backdrop near the hero too.

## SESSION 3 (2026-10-19)

- Fixed the home-screen install instructions in both places (`/help#install` and
  README §5). The old text named UI that does not exist («Дэмжих тэмдэг (H+)»,
  «Install app», «Хуудас дэлгэцэнд нэмэх», «хуураар»). Both iPhone (Safari) and
  Android (Chrome) now describe the real flow: Share / «⋮» →
  «Нүүр дэлгэцэнд нэмэх» → «Нэмэх».
- Removed other meaningless/foreign values: Russian leftovers in README
  («Два», «двухфактор», «слушалдаг»), the Next.js default favicon and the unused
  create-next-app SVGs.
- PWA assets: added `apple-touch-icon.png` (180), `icon-192.png`, `icon-512.png`,
  `icon-maskable-512.png`; the manifest has `id` + PNG icons and the site
  metadata points iOS at the PNG (iOS ignores SVG apple-touch-icons).
- Fixed a host-separation bug found by the layout check: staff login linked to
  `/help` and `/forgot-password`, which 404 on the staff host and left prefetch
  requests hanging. The links are now user-host only; staff are told to contact
  a super admin, and README explains that staff passwords are reset from
  Supabase Authentication (the site recovery callback refuses staff by design).
- Deployment docs: README now shows how the build-time `NEXT_PUBLIC_*` values
  reach Docker/systemd, the systemd build copies `.next/static` and `public`
  into `.next/standalone` (otherwise CSS/JS 404), and updates re-copy them after
  a rebuild; added `.dockerignore` so `.env*` never enters the build context.
- Replaced the Create Next App favicon with the site mark and removed the five
  unused scaffold SVGs from `public/`.

Checks this session: `typecheck`, `lint`, `build`, `smoke`, `contrast`, `layout`
all PASS (7 widths; kit routes skipped because they 404 under `next start`).

## AUDIT (2026-10-18, session 2)

- Real Supabase credentials arrived (written into `.env.local`; `.env.example` was
  sanitised back to names only — it briefly contained a live password).
- DB is reachable: `npm run db:apply` applies all four files, `npm run verify`
  **ALL CHECKS PASS** (15 RLS/RPC checks + 8 HTTP host-separation checks).
- `npm run smoke` **PASSED**, `npm run contrast` **PASSED**, `npm run layout`
  **PASSED** (77 checks, 7 widths, screenshots in `tmp/screens/`).
- Design system (R3) was the old Material-style kit (56px buttons, 22px radii,
  shadows on cards, FABs, role-based `density` prop). Replaced with the new
  adaptive kit: audience-driven density, flat cards, 10/14px radii, no FAB.
- `npm run typecheck`, `npm run lint`, `npm run build` green.

## Phases

- [x] P0 Scaffold
- [x] P1 Foundation (hosts, middleware, clients, health, robots, manifest)
- [x] P2 DB schema, RLS, RPCs — applied and verified against the live project
- [x] P3 New design system (tokens, shells, kit, `/__kit`, `/__kit/shell/[variant]`)
- [x] P4 Auth (register/login/forgot/reset/callback, staff login, MFA `/security`,
      `/join`, reauth, inactivity timeout) — restyled on the new kit + desktop aside
- [x] P5 Customer app (home, jobs grid + filter tabs, wizard, detail, profile)
- [x] P6 Worker app (home with side column + mini month, offers, calendar, profile)
- [x] P7 Admin app (today, pool, job detail, workers, calendar, notifications)
- [x] P8 Super admin app (dashboard, intake, admins, workers, jobs, catalog,
      settings, audit + CSV)
- [x] P9 Landing, help, PWA manifest, text size, offline banner
- [x] P10 QA scripts (verify/smoke/contrast/layout), README, deploy files

## File tree (top level)

```
db/                   01_schema, 02_rls, 03_rpc, 04_rpc_admin (applied)
scripts/              apply-sql, make-super-admin, list-staff, verify, smoke,
                      check-contrast, check-layout, env, lib/
src/app/site/**       landing, auth, /c, /w, /help, /__kit
src/app/staff/**      login, security, join, (admin)/*, (super)/*
src/components/ui/**  the new kit (28 components, one index)
src/components/app/** navs, AdminFrame, OfferActions, MiniMonth, StaffChip...
deploy/               Caddyfile, nginx.conf, zav.service
Dockerfile, docker-compose.yml, README.md
```

## Decisions

- Env: `.env.local` created from the credentials; `NEXT_PUBLIC_SUPABASE_URL` derived
  as `https://<ref>.supabase.co` (the value that arrived was a _postgres_ URL).
- Verify fixtures are inserted through SQL with the same `raw_user_meta_data` the
  signup API would send: hosted Supabase confirms emails and rate-limits the
  confirmation mail, so 8 accounts cannot be created back-to-back over HTTP. The
  signup trigger (role whitelist) is still exercised, and sign-in/MFA use the real
  REST API.
- `audit_logs` guard allows UPDATE/DELETE only for the owner (`postgres`), so the
  fixture cleanup can delete users while every API role stays read-only on the log.
- `revoke all on all tables in schema public from anon, authenticated` runs first in
  `db/02_rls.sql`: Supabase default privileges otherwise grant ALL to those roles
  (this was a real hole — the `role: admin` PATCH check failed because of it).
- Density is decided by `[data-audience]` + viewport media queries, never by role;
  `--control-h/--fs-body/--row-h` flow through the whole kit.
- Staff sidebar collapse is a `data-collapsed` attribute (CSS + localStorage), so
  there is no `setState` in an effect and no hydration mismatch.
- `check-layout.mjs` launches Chromium with `--host-resolver-rules` so `*.localhost`
  names work in a headless browser.

## Known issues / follow-ups

- A React console warning appears once on `/help` in dev (unknown DOM prop) —
  non-fatal, not reproduced in the headless check.
- Admin "office mode" still uses `DataList` cards on some screens; `DataTable` and
  `SplitPane` are available and used on jobs/workers, but not everywhere.
- Payments and SMS are intentionally out of scope ("planned later").
- The app must run as a single instance: the rate limiter is in-memory.

## Checks (session 4, app on `next start`)

- `npx tsc --noEmit` PASS, `npm run lint` PASS, `npm run build` PASS.
- `npm run backdrop` **PASS** — 6 page/width combinations (landing, login,
  register at 390 and 1440; `/c` skipped, 307 to login). Colour spread 39.2 to
  81.6 (minimum 14), top-left glow clearly darker than bottom-centre, 0 opaque
  covers at 5 points per page, 5 body gradients, hero backdrop contrast ink
  14.44–15.89:1 and `#075985` 6.12–6.73:1. Screenshots in `tmp/backdrop/`.
- `npm run layout` **PASS** — 35 checks at 360/390/768/1024/1280/1440/1920, no
  horizontal overflow; `/__kit` routes skipped because they 404 under
  `next start`.
- `npm run contrast` **PASS** — 26 token pairs + rendered backdrop sampling.
- `npm run smoke` **PASS** — 22/22 on both hosts.
- `npm run verify` **PASS** — 24 RLS/RPC/HTTP checks, fixtures removed (0 rows).
- DOM spot checks (Chromium): coarse pointer hides the dots and uses a solid
  white bar with no blur; the hero option card hover changes the border to
  `#7B8BA0` and moves −2px; the how-it-works band has 3 columns + connector;
  staff login is `data-audience="staff"` with one calm gradient and no covers.

### Decisions

- Audience is derived from the host in middleware and rendered on `<html>`
  server-side. A client script or a cookie would flash or need JS.
- `check-backdrop` samples a screenshot with the content hidden, so the pixels
  are the backdrop itself, never text; content covering the backdrop is caught
  separately by the `elementsFromPoint` cover check.
- The cover check skips rounded elements: the rules allow cards to be opaque,
  and the 358px-wide registration card on a 390px phone would otherwise be a
  false positive. Flat wrappers are still caught.
- The hero day grid is one `<pattern>` fill plus 6 highlighted cells, which
  keeps the rendered SVG at 3.4 KB (under the 4 KB budget).
- Added CSS for the backdrop itself is ~2.5 KB raw (tokens, body rules, glass
  bar, hero dots); page utilities live beside it.

### Acceptance

| Criterion | Result |
| --- | --- |
| Backdrop visible on public pages | PASS — spread 39.2–81.6, 5 gradients |
| No opaque wrapper covers it | PASS — 0 covers × 6 combos |
| Contrast | PASS — ink ≥ 14.44:1, `#075985` ≥ 6.12:1 |
| No horizontal overflow at 7 widths | PASS — 360…1920 |
| Landing balanced on desktop | PASS — 762px hero, left 618px, art 445×435 centred |
| No fake data | PASS — no invented numbers or people |
| `npm run verify` | PASS — 24 checks, fixtures removed |
| tsc, lint, build | PASS |

### Routes per host

Site host (`zav.localhost`, public backdrop): `/`, `/login`, `/register`,
`/forgot-password`, `/reset-password`, `/auth/callback`, `/help`, `/c`,
`/c/new`, `/c/jobs`, `/c/jobs/[id]`, `/c/me`, `/w`, `/w/offers`,
`/w/calendar`, `/w/me`, dev-only `/__kit*`.

Staff host (`admin.zav.localhost`, calm backdrop): `/login`, `/join`,
`/security`, `/today`, `/jobs`, `/jobs/[id]`, `/workers`, `/workers/[id]`,
`/calendar`, `/notifications`, `/super`, `/super/{admins,intake,workers,jobs,
catalog,settings,audit,audit/export}`.

### Removed files

- None this session: there was no `Backdrop.tsx` to delete. Only unused icon
  imports were dropped. The scaffold SVGs (`next/vercel/file/globe/window`)
  and `src/app/page.tsx` were removed in session 3.

### Manual visual checklist

1. 1440px `/`: sky glow top-left, amber top-right, mint mid-right, dot grid
   only in the hero, glass header; art sits beside the copy, not below it.
2. 390px `/`: header shows only logo + «Нэвтрэх», dots hidden, art under cards
   at 80% width, no horizontal scroll.
3. `/login` and `/staff/login` at ≥1024: 480px card + tinted art panel; on a
   phone only the card, with the backdrop visible around it.
4. `/c` and `/w`: greeting card uses the sky tint; section labels are uppercase
   and muted; empty states show the matching art.
5. Staff pages: no sky glow (staff backdrop only), cards stay flat.
6. Text size switch (large/xlarge) still scales without overflow.

## Next: manual review with real customer/worker/staff accounts (no unfinished
code phase; optional polish: admin office mode on `DataTable` everywhere).
