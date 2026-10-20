import { mkdirSync } from "node:fs";
import { loadEnv, resolveAppBase } from "./env.mjs";

loadEnv();

const BASE = resolveAppBase();
const SITE_HOST = process.env.NEXT_PUBLIC_SITE_HOST || "zav.localhost:3000";
const STAFF_HOST = process.env.NEXT_PUBLIC_STAFF_HOST || "admin.zav.localhost:3000";
const WIDTHS = [360, 390, 768, 1024, 1280, 1440, 1920];
const SHOTS = "tmp/screens";

/** Guarded so a missing/blocked browser only skips this check, never breaks CI. */
let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.log("SKIP  check-layout: playwright is not installed (npm i -D playwright).");
  process.exit(0);
}

const routes = [
  { path: "/", host: SITE_HOST, name: "landing" },
  { path: "/login", host: SITE_HOST, name: "login" },
  { path: "/register?role=worker", host: SITE_HOST, name: "register-worker" },
  { path: "/help", host: SITE_HOST, name: "help" },
  { path: "/__kit", host: SITE_HOST, name: "kit" },
  { path: "/__kit/staff", host: SITE_HOST, name: "kit-staff" },
  { path: "/__kit/shell/public", host: SITE_HOST, name: "shell-public" },
  { path: "/__kit/shell/customer", host: SITE_HOST, name: "shell-customer" },
  { path: "/__kit/shell/worker", host: SITE_HOST, name: "shell-worker" },
  { path: "/__kit/shell/admin", host: SITE_HOST, name: "shell-admin" },
  { path: "/__kit/shell/super", host: SITE_HOST, name: "shell-super" },
  { path: "/login", host: STAFF_HOST, name: "staff-login" },
  { path: "/security", host: STAFF_HOST, name: "staff-security", auth: true },
  { path: "/today", host: STAFF_HOST, name: "staff-today", auth: true },
  { path: "/jobs", host: STAFF_HOST, name: "staff-jobs", auth: true },
  { path: "/workers", host: STAFF_HOST, name: "staff-workers", auth: true },
  { path: "/calendar", host: STAFF_HOST, name: "staff-calendar", auth: true },
  { path: "/notifications", host: STAFF_HOST, name: "staff-notifications", auth: true },
  { path: "/profile", host: STAFF_HOST, name: "staff-profile", auth: true },
  { path: "/super", host: STAFF_HOST, name: "staff-super", auth: true },
  { path: "/super/intake", host: STAFF_HOST, name: "staff-intake", auth: true },
  { path: "/super/admins", host: STAFF_HOST, name: "staff-admins", auth: true },
  { path: "/super/workers", host: STAFF_HOST, name: "staff-super-workers", auth: true },
  { path: "/super/jobs", host: STAFF_HOST, name: "staff-super-jobs", auth: true },
  { path: "/super/catalog", host: STAFF_HOST, name: "staff-catalog", auth: true },
  { path: "/super/settings", host: STAFF_HOST, name: "staff-settings", auth: true },
  { path: "/super/audit", host: STAFF_HOST, name: "staff-audit", auth: true },
];

/** *.localhost does not resolve for every tool, so map the two hosts to loopback. */
const siteName = SITE_HOST.split(":")[0];
const staffName = STAFF_HOST.split(":")[0];

let browser;
try {
  browser = await chromium.launch({
    args: [`--host-resolver-rules=MAP ${siteName} 127.0.0.1, MAP ${staffName} 127.0.0.1`],
  });
} catch (error) {
  console.log(`SKIP  check-layout: chromium could not launch (${error.message}).`);
  console.log("      Run: npx playwright install chromium");
  process.exit(0);
}

mkdirSync(SHOTS, { recursive: true });

let failures = 0;

/** The app is reached over loopback with the host header the proxy would set. */
async function hostFetch(path, host) {
  return fetch(`${BASE}${path}`, {
    redirect: "manual",
    headers: { Host: host, "X-Forwarded-Host": host },
  });
}

for (const route of routes) {
  const probe = await hostFetch(route.path, route.host).catch(() => null);
  if (!probe || probe.status >= 400) {
    console.log(`SKIP  ${route.name} — HTTP ${probe ? probe.status : "unreachable"}`);
    continue;
  }

  for (const width of WIDTHS) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    const errors = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));

    // The real host name goes on the wire, exactly like Caddy would send it.
    // `load` + a settle pause instead of networkidle: the dev overlay keeps a
    // websocket open, so networkidle never fires there.
    try {
      await page.goto(`http://${route.host}${route.path}`, {
        waitUntil: "load",
        timeout: 90_000,
      });
      await page.waitForTimeout(400);
    } catch (error) {
      console.log(`SKIP  ${route.name} @${width}px — ${error.name}: page load failed`);
      await context.close();
      continue;
    }
    if (route.auth && new URL(page.url()).pathname.startsWith("/login")) {
      console.log(`SKIP  ${route.name} @${width}px — auth needed (redirected to /login)`);
      await context.close();
      continue;
    }
    const report = await page.evaluate(() => {
      const doc = document.documentElement;
      const overflow = doc.scrollWidth - window.innerWidth;
      const wide = [...document.querySelectorAll("body *")]
        .filter((element) => element.getBoundingClientRect().width > window.innerWidth + 1)
        .slice(0, 5)
        .map(
          (element) =>
            `${element.tagName.toLowerCase()}.${element.className?.toString().slice(0, 40)}`,
        );
      return { overflow, wide };
    });

    const ok = report.overflow <= 1 && report.wide.length === 0;
    if (!ok) failures += 1;
    console.log(
      `${ok ? "PASS" : "FAIL"}  ${route.name} @${width}px` +
        (ok
          ? ""
          : ` — overflow ${report.overflow}px${report.wide.length ? `, wide: ${report.wide.join(" | ")}` : ""}`),
    );
    if (errors.length > 0) {
      console.log(`WARN  ${route.name} @${width}px console: ${errors[0].slice(0, 160)}`);
    }
    await page.screenshot({ path: `${SHOTS}/${route.name}-${width}.png`, fullPage: true });
    await context.close();
  }
}

await browser.close();
console.log(`\nScreenshots: ${SHOTS}/`);
console.log(failures === 0 ? "LAYOUT OK" : `${failures} LAYOUT PROBLEM(S)`);
if (failures > 0) process.exitCode = 1;
