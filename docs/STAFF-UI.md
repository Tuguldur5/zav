# STAFF-UI v3: recolor to the site palette, fix the sidebar, polish (admin + super admin ONLY)

Project: existing Next.js 15 + Tailwind + Supabase app. Staff host (admin, super_admin screens) already has a first redesign: a narrow icon-only left rail, a top bar (group label + page title, bell, profile), a lilac banner with the description and the primary button, white tiles with indigo icon chips, cards with an indigo vertical bar before titles, a very tall empty state. This file replaces every earlier staff-UI instruction. Public, customer and worker screens must NOT change.

## 0. Rules for every session

- Do ONLY the phase named in the session prompt, then update PROGRESS.md ("Done: Vn", "Next: Vn+1", findings) and stop.
- Small context: read files in chunks of at most 150 lines, use search, never open a whole large CSS file, keep each file you write under ~300 lines, write COMPLETE files (no "...", no TODO). UI text is Mongolian Cyrillic in `src/lib/i18n/*`; code/comments English. Never print or commit secrets. No new npm packages. No `dangerouslySetInnerHTML`. No fake data in production pages.
- Test only on a FRESH production build: `rm -rf .next && npm run build && npm start` (one server, port 3000).
- Before V0: `git add -A && git commit -m "checkpoint before staff ui 3"; git tag -f pre-staff-ui-3`.
- VISUAL-ONLY. FROZEN (git diff vs the tag must be empty): `db/`, `src/lib/**` except `src/lib/i18n/**`, `src/middleware.ts`, `next.config.ts`, `src/app/api/**`, every `actions.ts`/`actions/` file, `scripts/verify*.mjs`, auth/MFA code. Inside existing components do NOT change props, hooks, handlers, form actions, data fetching, queries, RPC calls, redirects, validation, routes, nav items. CHANGEABLE: `className` values, wrapper markup, new presentational components, styles, Mongolian copy. ONE allowed logic fix: the sidebar toggle bug (section 2).
- If `scripts/check-visual-only.mjs` exists run it (retag base to `pre-staff-ui-3`); otherwise create a simple version: frozen paths have no diff, and counts of `.rpc(`, `.from(`, `fetch(`, `"use server"`, `redirect(`, `action={`, `router.push(`, `use(State|Effect|Memo|Callback|Reducer|Ref|Transition)\(`, `on[A-Z]\w*=\{` across `src/app/staff/**` and `src/components/staff/**` do not decrease versus the base. Add npm script `check:visual`.
- After each phase run `npx tsc --noEmit`, `npm run lint`, `npm run check:visual`, `npm run check:colors`; `npm run build` in V1, V3, V5.
- When restyling an element REPLACE its whole `className` (remove legacy classes), never build class names dynamically, delete legacy staff CSS once unused. Look = plain CSS classes `st-*` in the staff stylesheet scoped under `.staff-theme` using only the variables below; layout = Tailwind utilities.

## 1. Palette = the site's base colours (ink, lime, paper). NO indigo/violet/purple/blue anywhere in staff

```css
.staff-theme{
  --st-bg:#F5F6F8; --st-surface:#FFFFFF; --st-row:#F1F3F6; --st-line:#DDE1E7; --st-outline:#7A8494;
  --st-ink:#0E1116; --st-ink-2:#1A2029; --st-muted:#566070;
  --st-signal:#C8F135; --st-signal-hover:#B7E014; --st-signal-soft:#F0FBC4; --st-on-signal:#0E1116;
  --st-green:#3F6212;
  --st-btn:#0E1116; --st-btn-hover:#1A2029; --st-on-btn:#FFFFFF;
  --st-ok:#14532D; --st-ok-bg:#DCFCE7; --st-warn:#7C2D12; --st-warn-bg:#FFEDD5; --st-err:#991B1B; --st-err-bg:#FEE2E2;
  --st-logo-bg:#C8F135; --st-logo-fg:#0E1116;
  --st-r-card:16px; --st-r-ctl:12px; --st-r-pill:999px;
  --st-sidebar-w:248px; --st-rail-w:72px; --st-topbar-h:64px;
}
.staff-theme[data-staff-tone="super"]{ --st-logo-bg:#0E1116; --st-logo-fg:#C8F135; }
html[data-audience="staff"], html[data-audience="staff"] body{ background:var(--st-bg); color:var(--st-ink); }
```

Verified ratios: ink on bg 17.5, ink on surface 18.9, muted on bg 5.9, muted on surface 6.4, muted on row 5.7, white on ink 18.9, ink on signal 14.5, ink on signal-soft 17.4, green on white 7.1, green on signal-soft 6.5, outline on white 3.8, ok 8.3, warn 8.2, err 6.8.

RULES: LIME is a FILL only, always with ink text/icons (never lime text or lime lines on a light surface; it is 1.3:1 there). Green text and thin lines use `--st-green`. Primary buttons are INK with white text (hover `--st-btn-hover`), outline buttons are white with 1px `--st-line`. Focus ring = 2px `--st-ink` with 2px white offset on every interactive element. Status colours only on small status pills and warning accents (icon + text, never colour alone). Flat look: cards = surface + 1px `--st-line` + 16px radius, no shadows (only menus/dialogs/tooltips get `0 8px 24px rgba(14,17,22,.12)`), no gradients except a faint lime area fill in charts, no glass/blur. Keep the site font (renders Ү ү Ө ө), weights 400/500/600/700.

Charts: AreaChart = 2px ink line, area fill `--st-signal` at 35% fading to 0, hairline `--st-line` gridlines, ink tooltip; BarChart = bars `--st-ink` (track `--st-line`, >= 3:1), overload bar `--st-err`; "free slot" visuals use lime, "taken/confirmed" use ink with a white check (same motif as the public site).

Create `scripts/check-colors.mjs` (`npm run check:colors`): scans `src/styles/*`, `src/components/staff/**`, `src/app/staff/**` (and compiled staff CSS if present) and FAILS on (a) the words/classes `indigo|violet|purple|fuchsia|blue-|sky-` and legacy hex values from the base version, (b) any hex colour whose HSL hue is between 190 and 300 with saturation > 0.2, (c) raw hex values outside the token block. Update `scripts/check-contrast.mjs` for the pairs listed above (text >= 4.5, tile text >= 7, borders/icons >= 3) and make both scripts pass.

## 2. Sidebar (fix the collapse bug and rebuild the look)

BUG (screenshot): the sidebar is stuck in an icon-only rail with no visible way to expand it. T0 diagnosis (write the cause in PROGRESS.md): find the sidebar component; check where the collapsed state is stored/read (localStorage/cookie/query), whether the toggle button is rendered in the collapsed state, whether CSS hides it (`display:none`, zero width, overflow), and whether breakpoints force the rail.

Behaviour:

- Two states: EXPANDED (248px: icon + label, group labels) and COLLAPSED (72px: icons only with tooltips). Defaults: expanded at >= 1280px; collapsed at 1024-1279px until the user chooses; below 1024px there is no sidebar (bottom bar, V4).
- A toggle button is ALWAYS visible: expanded = in the sidebar header at the right (chevron-left, label "Хураах"); collapsed = centered under the logo tile (chevron-right, `title="Дэлгэх"`). Also `Ctrl/Cmd+B`. `aria-expanded`, `aria-controls`, 44px hit area. Never remove the toggle in any state.
- Persist the user's choice in a cookie `st_sb=expanded|collapsed` (path `/`, max-age 1 year, SameSite=Lax). The staff layout reads it on the server and renders the correct state, so there is no flash. Ignore invalid or stale values (fall back to the default). Optional safety net: opening any staff URL with `?sb=expanded` resets the choice.
- Width animates in 200ms (labels fade); `prefers-reduced-motion` = instant. Collapsed items show a CSS tooltip with the label on hover and on keyboard focus; count badges become a small number pill at the icon's top-right; group labels become hairline dividers; the bottom status card becomes a shield icon with a green dot.
- Expanded look: sidebar surface white, 1px `--st-line` on the right, sticky full height, own scroll when needed. Header: logo tile (40px, `--st-logo-bg/fg`, check icon) + "Зав байна" + muted role ("Админ"/"Супер админ") + toggle. NAV groups: uppercase 11px muted label with .08em tracking, then items (icon 18px + label 14px/500, height 40px, radius 12px). Active item = `--st-signal` fill + ink text + weight 600 + `aria-current="page"`; hover = `--st-row`. Count badge = ink pill with white number (20px high). Bottom status card (`--st-row` bg, radius 14px): green dot + "MFA идэвхтэй" (amber with link to `/security` if inactive) and muted "Сүүлд нэвтэрсэн: <relative time>" (real values only).
- Keep the existing nav items, groups and routes exactly (admin: Өнөөдөр, Зарууд, Ажилчид, Календар, Мэдэгдэл; super: Самбар, Шинэ ажилчид, Админууд, Ажилчид, Зарууд, Тохиргоо). A super never links to admin routes and vice versa.
- Test: create dev-only page `/__staff` (staff host, 404 in production) rendering the shell with sample content, and `scripts/check-sidebar.mjs` (`npm run check:sidebar`, Playwright, dev server): click toggle -> width 72 and the toggle is still visible -> click again -> width 248 -> reload keeps the state -> `Ctrl+B` works -> tooltips appear on focus. If Playwright cannot run, say so in PROGRESS.md and review by code.

## 3. Page polish (apply to ALL admin and super pages through shared components)

- Top bar (64px, surface, 1px bottom line): left = page title block on phones only; on desktop it holds the group label + title as now; right = bell with count (popover of the latest 5 notifications) and the profile (initials avatar on `--st-signal-soft` with ink text, name, muted email, chevron; menu: Профайл, Аюулгүй байдал, Үсгийн хэмжээ, Гарах). No global search in this task.
- REMOVE the lilac banner and every left accent border. Page header (below the top bar, no card): small muted group label, H1 28/34 weight 600, one-line muted description (numbers in bold), and on the right at most ONE black primary button with an icon (e.g. "Ажилтан хуваарилах") plus optionally one outline button.
- `Section` header: a small lime "slot" bar (14x6px, radius 3px) + title 16/600 + count pill (`--st-row` bg, ink text) + right-aligned muted meta text or link. No vertical coloured bars, no divider lines inside cards (use spacing).
- `StatTile` (4 per row on desktop, 2 on phones): surface card, label 13px muted, number 28/34 weight 700, a 28px icon chip top-right (`--st-signal-soft` bg, `--st-green` icon). Attention variant (count > 0): dashed 2px `--st-warn` border and `--st-warn` number, with a "!" icon; zero counts are shown in muted ink.
- `EmptyState`: compact (padding 24px, no fixed min-height, at most ~160px tall), small outline icon, title 15/600, one muted sentence, ONE button. If the empty state already carries the action, remove the duplicate link from the section header.
- `ListRow` ("Анхаарах зүйлс" and similar): the whole row is a link; 40px icon tile (`--st-signal-soft`, `--st-green` icon), bold title, muted one-line subtitle (truncate), count pill, chevron. Remove the separate "Нээх" button.
- Admin load list: row = initials avatar, name, "N ажилтан", 8px bar (fill `--st-ink` on `--st-line`, width = workers / capacity, over capacity `--st-err`); move "Дундаж ачаалал: X · багтаамж Y" to the right as muted meta.
- Tables/lists on every other page: white card, header row `--st-row`, 48px rows, hover `--st-row`, at most TWO visible buttons per row (rest in "⋯"), button labels max 22 characters, long text truncates with a title tooltip. Tabs: active = lime fill + ink text pill; inactive muted. Calendar cells: free = lime, confirmed = ink with white check, booked = `--st-warn-bg`, unmarked = surface, past dimmed, legend with colour + icon + text. Staff login, `/security`, `/join`: paper background, centred white card 440px, ink logo tile, no role wording.
- Data note (not a design task): the list shows "Verify job A" rows. They are leftovers of `scripts/verify.mjs` fixtures. If `scripts/cleanup-fixtures.mjs` exists run it (it must refuse to delete real accounts) and make sure `verify.mjs` removes its fixtures in a `finally` block; do not hide them in the UI.

## 4. Phone (< 1024px)

No sidebar. Top bar 56px: logo tile, page title, bell, avatar. FLAT bottom tab bar (surface, 1px top line, safe-area padding, icon + 11px label; active = lime pill + ink text): admin = Өнөөдөр, Зарууд, Ажилчид, Календар, Бусад; super = Самбар, Шинэ ажилчид, Админууд, Зарууд, Бусад. "Бусад" opens a bottom sheet (remaining pages, Профайл, Аюулгүй байдал, Гарах). The page's black primary button becomes a full-width sticky button above the tab bar only where needed. Content bottom padding 96px; cards 1 column (2 from 640px); tiles 2 columns; tables become cards; touch targets >= 44px, controls 48px; no horizontal page scroll. Keep the field features (Залгах `tel:`, Мессеж `sms:`, the sticky "Ярилцлага хэр болов?" bar after a call).

## 5. Phases

- V0 Diagnose and tokens: git tag, sidebar bug cause, the token block, grep and remove every indigo/violet value, `check-colors.mjs`, contrast update, `/__staff` page. Done when `check:colors` and `contrast` pass on a fresh build.
- V1 Sidebar and shell (section 2) with `check:sidebar`. Build.
- V2 Header, sections, tiles, empty states, list rows (section 3) on `/super` and `/today` first.
- V3 Sweep every other staff page and the staff login/security/join. Build.
- V4 Phone layout (section 4).
- V5 QA: `npm run contrast`, `check:colors`, `check:visual`, `check:sidebar`, `check:links`, `density` (if present), `layout` (widths 360, 768, 1024, 1280, 1440), `verify`, `npx tsc --noEmit`, `npm run lint`, `npm run build`. Save screenshots of `/today`, `/super`, `/jobs`, `/security` at 390 and 1440 to `tmp/screens/`.

## 6. Acceptance

No indigo/violet left (check:colors PASS) | ink + lime + paper palette, lime only as fill with ink text | sidebar expanded by default with labels, toggle always visible, state persists without flash | no banner, no accent side bars, compact empty states, one primary button per page | contrast PASS | frozen paths untouched, logic token counts not lower | phone bottom bar works | verify PASS | tsc, lint, build clean | public/customer/worker visuals unchanged.
