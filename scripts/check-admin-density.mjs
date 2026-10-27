#!/usr/bin/env node
/**
 * Admin desktop density check (dev-only, needs the app running).
 *
 * Fails when a staff page at 1440 or 1920px has
 *   - a button/link-button label longer than 22 characters
 *   - a [data-row] with more than two visible buttons
 *   - more than one [data-primary] button
 *   - horizontal overflow
 *
 * Routes that need a session are skipped when the app redirects to /login,
 * because the fixture accounts cannot be created without a database.
 */
import { loadEnv, resolveAppBase } from "./env.mjs";

loadEnv();

const BASE = resolveAppBase();
const STAFF_HOST = process.env.NEXT_PUBLIC_STAFF_HOST || "admin.zav.localhost:3000";
const WIDTHS = [1440, 1920];
const MAX_LABEL = 22;

const ROUTES = [
  { path: "/login", name: "staff-login", auth: false },
  { path: "/today", name: "today", auth: true },
  { path: "/jobs", name: "jobs", auth: true },
  { path: "/workers", name: "workers", auth: true },
  { path: "/calendar", name: "calendar", auth: true },
  { path: "/notifications", name: "notifications", auth: true },
  { path: "/profile", name: "profile", auth: true },
  { path: "/super", name: "super", auth: true },
  { path: "/super/intake", name: "super-intake", auth: true },
  { path: "/super/admins", name: "super-admins", auth: true },
  { path: "/super/workers", name: "super-workers", auth: true },
  { path: "/super/jobs", name: "super-jobs", auth: true },
  { path: "/super/catalog", name: "super-catalog", auth: true },
  { path: "/super/settings", name: "super-settings", auth: true },
  { path: "/super/audit", name: "super-audit", auth: true },
];

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.log("SKIP  check-admin-density: playwright is not installed.");
  process.exit(0);
}

const hostName = STAFF_HOST.split(":")[0];

let browser;
try {
  browser = await chromium.launch({
    args: [`--host-resolver-rules=MAP ${hostName} 127.0.0.1`],
  });
} catch (error) {
  console.log(`SKIP  check-admin-density: chromium could not launch (${error.message}).`);
  process.exit(0);
}

let failures = 0;
let checked = 0;
let skipped = 0;

for (const route of ROUTES) {
  const probe = await fetch(`${BASE}${route.path}`, {
    redirect: "manual",
    headers: { Host: STAFF_HOST, "X-Forwarded-Host": STAFF_HOST },
  }).catch(() => null);
  if (!probe || probe.status >= 400) {
    console.log(`SKIP  ${route.name} — HTTP ${probe ? probe.status : "unreachable"}`);
    skipped += 1;
    continue;
  }

  for (const width of WIDTHS) {
    const context = await browser.newContext({ viewport: { width, height: 1000 } });
    const page = await context.newPage();
    try {
      await page.goto(`http://${STAFF_HOST}${route.path}`, { waitUntil: "load", timeout: 90_000 });
      await page.waitForTimeout(300);
    } catch (error) {
      console.log(`SKIP  ${route.name} @${width}px — ${error.name}: page load failed`);
      skipped += 1;
      await context.close();
      continue;
    }

    if (route.auth && new URL(page.url()).pathname.startsWith("/login")) {
      console.log(`SKIP  ${route.name} @${width}px — auth needed (no seeded session)`);
      skipped += 1;
      await context.close();
      continue;
    }

    const result = await page.evaluate((maxLabel) => {
      const visible = (element) => {
        const box = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return box.width > 0 && box.height > 0 && style.visibility !== "hidden";
      };
      const controls = [...document.querySelectorAll("a.st-btn, button, [role='button'], a[data-primary]")];
      const longLabels = controls
        .filter(visible)
        .map((element) => (element.textContent || "").replace(/\s+/g, " ").trim())
        .filter((label) => label.length > maxLabel);

      const crowdedRows = [...document.querySelectorAll("[data-row]")]
        .filter(visible)
        .map((row) => ({
          label: (row.querySelector("a, span, h3")?.textContent || "row").trim().slice(0, 40),
          count: [...row.querySelectorAll("a.st-btn, button, [role='button']")].filter(visible).length,
        }))
        .filter((row) => row.count > 2);

      const primaries = [...document.querySelectorAll("[data-primary]")].filter(visible).length;
      const overflow = document.documentElement.scrollWidth - window.innerWidth;
      return { longLabels, crowdedRows, primaries, overflow };
    }, MAX_LABEL);

    const problems = [];
    if (result.longLabels.length > 0) {
      problems.push(
        `${result.longLabels.length} long label(s): ${result.longLabels
          .slice(0, 3)
          .map((label) => `"${label}" (${label.length})`)
          .join(", ")}`,
      );
    }
    if (result.crowdedRows.length > 0) {
      problems.push(
        `${result.crowdedRows.length} row(s) with >2 actions: ${result.crowdedRows
          .slice(0, 3)
          .map((row) => `${row.label} (${row.count})`)
          .join(", ")}`,
      );
    }
    if (result.primaries > 1) problems.push(`${result.primaries} primary buttons`);
    if (result.overflow > 1) problems.push(`horizontal overflow ${result.overflow}px`);

    checked += 1;
    if (problems.length > 0) {
      failures += 1;
      console.log(`FAIL  ${route.name} @${width}px — ${problems.join("; ")}`);
    } else {
      console.log(`PASS  ${route.name} @${width}px — short labels, max 2 actions per row`);
    }
    await context.close();
  }
}

await browser.close();

console.log(
  `\ncheck-admin-density: ${checked} page/width checks, ${failures} failed, ${skipped} skipped.`,
);
if (failures > 0) process.exit(1);
