#!/usr/bin/env node
/**
 * Proves that the RUNNING server really serves the staff look on the staff host.
 *
 * Expects a fresh production build already running (`npm start`, port 3000).
 * Nothing here talks to the database: it only reads HTML and CSS.
 *
 * 1. GET /login with the staff Host header, then check the staff <html>:
 *    `staff-theme`, `data-audience="staff"`, `data-theme`.
 * 2. Fetch every stylesheet the page links and check that the staff block is
 *    inside the bundle: the public-paper/lime canvas, accent/button tokens and wash
 *    and `--st-r-card`. The pre-redesign teal must be gone. The names the old
 *    rules still alias (`--st-subtle`, `--st-border`, …) are printed as WARN.
 * 3. When Playwright works and the dev gallery `/__staff` answers (dev server
 *    only — it is 404 in production), also compare computed styles.
 * 4. Guard the title rule: the shell's topbar H1 is the only page title, so no
 *    staff file may add another H1 and `PageHeader` may not take a title.
 *
 * Usage: npm run check:staffstyle
 */
import { loadEnv } from "./env.mjs";

loadEnv();

const STAFF_HOST = process.env.NEXT_PUBLIC_STAFF_HOST || "admin.zav.localhost:3000";
const PORT = STAFF_HOST.split(":")[1] || "3000";
const BASE = `http://127.0.0.1:${PORT}`;
const HEADERS = { Host: STAFF_HOST, "X-Forwarded-Host": STAFF_HOST };

const PALETTE = [
  [/--st-bg:\s*var\(--paper\)/i, "--st-bg follows the public paper token"],
  [/--st-accent:\s*var\(--signal\)/i, "--st-accent follows the public lime token"],
  [/--st-btn:\s*var\(--signal\)/i, "--st-btn follows the public lime token"],
  [/--st-accent-wash:/i, "--st-accent-wash (tinted rows and table heads)"],
  [/--st-r-card:/i, "--st-r-card (staff radius tokens)"],
];
const LEGACY_COLOURS = ["#0f766e", "#134e4a", "#f0fdfa", "#ccfbf1"];
const LEGACY_TOKENS = [
  "--st-subtle",
  "--st-border",
  "--st-accent-soft-2",
  "--st-radius-card",
  "--st-radius-ctl",
  "--st-pop-shadow",
];

let failed = 0;

function pass(label) {
  console.log(`  PASS  ${label}`);
}

function fail(label) {
  failed += 1;
  console.log(`  FAIL  ${label}`);
}

function warn(label) {
  console.log(`  WARN  ${label}`);
}

let html = "";
let status = 0;

try {
  const response = await fetch(`${BASE}/login`, { headers: HEADERS, redirect: "follow" });
  status = response.status;
  html = await response.text();
} catch (error) {
  console.log(`\nCannot reach ${BASE}. Start the production server first: npm start`);
  console.log(`  ${error.message}`);
  process.exit(1);
}

console.log(`\n(a) staff <html> on ${STAFF_HOST}/login (HTTP ${status})`);
if (status !== 200) fail(`expected 200, got ${status}`);
else pass("200 OK");

const htmlChecks = [
  [/class="[^"]*\bstaff-theme\b/, "staff-theme class"],
  [/data-audience="staff"/, 'data-audience="staff"'],
  [/data-theme="(?:light|dark)"/, "data-theme (light/dark)"],
  [/data-staff-tone="(?:admin|super)"/, 'data-staff-tone="admin|super"'],
];
for (const [pattern, label] of htmlChecks) {
  if (pattern.test(html)) pass(label);
  else fail(`${label} missing from the first byte of HTML`);
}

console.log("\n(b) staff block inside the served CSS");
const hrefs = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]*href="([^"]+)"/g)].map(
  (match) => match[1],
);
if (hrefs.length === 0) {
  // Next inlines the CSS link without rel when it is preloaded; fall back to any css href.
  hrefs.push(...[...html.matchAll(/href="([^"]+\.css[^"]*)"/g)].map((match) => match[1]));
}
const unique = [...new Set(hrefs)];
if (unique.length === 0) fail("no stylesheet link found in the HTML");

let css = "";
for (const href of unique) {
  const url = href.startsWith("http") ? href : `${BASE}${href.startsWith("/") ? "" : "/"}${href}`;
  try {
    const response = await fetch(url, { headers: HEADERS });
    const body = await response.text();
    if (!response.ok) fail(`${href} -> HTTP ${response.status}`);
    css += body;
  } catch (error) {
    fail(`${href} could not be fetched (${error.message})`);
  }
}

if (css) {
  console.log(`  ${unique.length} stylesheet(s), ${(css.length / 1024).toFixed(1)} kB`);
  for (const [pattern, label] of PALETTE) {
    if (pattern.test(css)) pass(label);
    else fail(`${label} not found in the served CSS`);
  }

  const legacy = LEGACY_COLOURS.filter((hex) => css.toLowerCase().includes(hex));
  if (legacy.length === 0) pass("no pre-redesign teal colour left");
  else fail(`old teal still served: ${legacy.join(", ")}`);

  const aliases = LEGACY_TOKENS.filter((name) => new RegExp(`${name}\\s*:`).test(css));
  if (aliases.length === 0) pass("no legacy staff token left");
  else warn(`legacy aliases still served (removed in T1/T2): ${aliases.join(", ")}`);
}

console.log("\n(c) computed styles in a real browser");
async function browserCheck() {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    return "SKIP  playwright is not available";
  }

  let browser;
  try {
    browser = await chromium.launch();
  } catch {
    return "SKIP  playwright has no browser installed";
  }

  try {
    const page = await browser.newPage();
    const lines = [];

    // Chromium resolves *.localhost to loopback, so the real staff host works.
    const login = await page.goto(`http://${STAFF_HOST}/login`, {
      waitUntil: "load",
      timeout: 60_000,
    });
    if (!login || login.status() !== 200) return "SKIP  /login did not answer in the browser";

    const painted = await page.evaluate(() => ({
      body: getComputedStyle(document.body).backgroundColor,
      ink: getComputedStyle(document.body).color,
      theme: document.documentElement.dataset.theme,
    }));
    const rows = [
      [painted.body === "rgb(245, 246, 248)", `body background ${painted.body}`],
      [painted.ink === "rgb(14, 17, 22)", `body ink ${painted.ink}`],
      [painted.theme === "light", `data-theme ${painted.theme}`],
    ];

    // The dev gallery carries the shell classes; production answers 404 there.
    let kit = null;
    try {
      kit = await page.goto(`http://${STAFF_HOST}/__staff`, {
        waitUntil: "load",
        timeout: 60_000,
      });
    } catch (error) {
      lines.push(`  SKIP  /__staff could not be loaded (${error.message.split("\n")[0]})`);
    }
    if (kit && kit.status() === 200) {
      const sidebar = await page.evaluate(() => {
        const node = document.querySelector(".st-sidebar");
        return node ? getComputedStyle(node).width : null;
      });
      if (sidebar) rows.push([sidebar === "264px", `.st-sidebar width ${sidebar}`]);
    } else {
      lines.push("  SKIP  /__staff is dev-only (404 in production)");
    }

    lines.unshift(
      ...rows.map(([ok, label]) => {
        if (!ok) failed += 1;
        return `  ${ok ? "PASS" : "FAIL"}  ${label}`;
      }),
    );
    return lines.join("\n");
  } finally {
    await browser.close();
  }
}

console.log(await browserCheck());

console.log("\n(d) one page title per screen");
const { readFileSync, readdirSync, statSync } = await import("node:fs");
const path = await import("node:path");
const SRC = path.resolve(process.cwd(), "src");

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.tsx$/.test(entry)) out.push(full);
  }
  return out;
}

// Auth screens have no topbar and the dev gallery is not a shell page, so the
// rule is: a signed-in staff PAGE never renders its own H1.
const pageFiles = ["(admin)", "(super)", "(shared)"].flatMap((group) =>
  walk(path.join(SRC, "app", "staff", group)),
);
const pageH1 = pageFiles.filter((file) => /<h1\b/.test(readFileSync(file, "utf8")));
if (pageH1.length === 0) {
  pass(`no page file renders an H1 (${pageFiles.length} files checked)`);
} else {
  fail(
    `page-level H1 duplicates the topbar title: ${pageH1
      .map((file) => path.relative(process.cwd(), file).replace(/\\/g, "/"))
      .join(", ")}`,
  );
}

const shell = readFileSync(path.join(SRC, "components", "staff", "StaffShell.tsx"), "utf8");
const shellH1 = [...shell.matchAll(/<h1\b[^>]*>/g)];
if (shellH1.length === 1 && shellH1[0][0].includes("st-crumb-title")) {
  pass("the shell renders exactly one H1: the topbar page title");
} else {
  fail(`expected one <h1 class="st-crumb-title"> in StaffShell, found ${shellH1.length}`);
}

const pageHeader = readFileSync(path.join(SRC, "components", "staff", "ui.tsx"), "utf8");
const pageHeaderBlock = pageHeader.match(/export function PageHeader\([\s\S]*?\n}/)?.[0] ?? "";
if (!pageHeaderBlock) fail("PageHeader not found in components/staff/ui.tsx");
else if (/\btitle\b|<h1\b/.test(pageHeaderBlock)) {
  fail("PageHeader still renders or accepts a title — that duplicates the topbar H1");
} else {
  pass("PageHeader renders description + actions only");
}

console.log(failed === 0 ? "\ncheck:staffstyle PASS\n" : `\ncheck:staffstyle FAIL (${failed})\n`);
process.exit(failed === 0 ? 0 : 1);
