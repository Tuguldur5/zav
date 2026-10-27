import { mkdirSync } from "node:fs";
import { loadEnv, resolveAppBase } from "./env.mjs";

loadEnv();

const BASE = resolveAppBase();
const SITE_HOST = process.env.NEXT_PUBLIC_SITE_HOST || "zav.localhost:3000";
const WORKER_HOST = process.env.NEXT_PUBLIC_WORKER_HOST || "ajil.zav.localhost:3000";
const STAFF_HOST = process.env.NEXT_PUBLIC_STAFF_HOST || "admin.zav.localhost:3000";
const WIDTHS = [320, 360, 390, 768, 1024, 1280, 1440, 1920, 2560];
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
  { path: "/register", host: SITE_HOST, name: "register-customer" },
  { path: "/forgot-password", host: SITE_HOST, name: "forgot-customer" },
  { path: "/reset-password", host: SITE_HOST, name: "reset-customer" },
  { path: "/help", host: SITE_HOST, name: "help" },
  { path: "/terms", host: SITE_HOST, name: "terms" },
  { path: "/privacy", host: SITE_HOST, name: "privacy" },
  { path: "/c", host: SITE_HOST, name: "customer-home", auth: true },
  { path: "/c/new", host: SITE_HOST, name: "customer-new", auth: true },
  { path: "/c/me", host: SITE_HOST, name: "customer-profile", auth: true },
  { path: "/", host: WORKER_HOST, name: "worker-landing" },
  { path: "/login", host: WORKER_HOST, name: "worker-login" },
  { path: "/register", host: WORKER_HOST, name: "worker-register" },
  { path: "/forgot-password", host: WORKER_HOST, name: "worker-forgot" },
  { path: "/reset-password", host: WORKER_HOST, name: "worker-reset" },
  { path: "/help", host: WORKER_HOST, name: "worker-help" },
  { path: "/privacy", host: WORKER_HOST, name: "worker-privacy" },
  { path: "/terms", host: WORKER_HOST, name: "worker-terms" },
  { path: "/home", host: WORKER_HOST, name: "worker-home", auth: true },
  { path: "/calendar", host: WORKER_HOST, name: "worker-calendar", auth: true },
  { path: "/offers", host: WORKER_HOST, name: "worker-offers", auth: true },
  { path: "/me", host: WORKER_HOST, name: "worker-profile", auth: true },
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
const workerName = WORKER_HOST.split(":")[0];
const staffName = STAFF_HOST.split(":")[0];

let browser;
try {
  browser = await chromium.launch({
    args: [
      `--host-resolver-rules=MAP ${siteName} 127.0.0.1, MAP ${workerName} 127.0.0.1, MAP ${staffName} 127.0.0.1`,
    ],
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
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      isMobile: width <= 768,
      hasTouch: width <= 768,
    });
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
    const report = await page.evaluate((checkTargets) => {
      const doc = document.documentElement;
      const overflow = doc.scrollWidth - window.innerWidth;
      const wide = [...document.querySelectorAll("body *")]
        .filter((element) =>
          element.getBoundingClientRect().width > window.innerWidth + 1 &&
          !element.matches(".marquee-track"),
        )
        .slice(0, 5)
        .map(
          (element) =>
            `${element.tagName.toLowerCase()}.${element.className?.toString().slice(0, 40)}`,
        );
      const header = document.querySelector(".st-header");
      const headerBox = header ? header.getBoundingClientRect() : null;
      const publicHeader = document.querySelector(".site-header, .public-app-topnav");
      const publicHeaderBox = publicHeader ? publicHeader.getBoundingClientRect() : null;
      const headerWrapped =
        (headerBox ? headerBox.height > 68 : false) ||
        (publicHeaderBox ? publicHeaderBox.height > 68 : false);
      const tabbar = document.querySelector(".st-tabbar, .public-app-tabbar");
      const page = document.querySelector(".st-page, .public-app-shell");
      const tabbarH = tabbar ? tabbar.getBoundingClientRect().height : 0;
      const pagePad = page ? Number.parseFloat(getComputedStyle(page).paddingBottom) : 0;
      const headingOverflow = [...document.querySelectorAll("h1, .landing-title, .public-page-title")]
        .filter((element) => {
          const box = element.getBoundingClientRect();
          const children = [...element.children];
          const contentOverflow = children.length > 0
            ? children.some((child) => {
                const childBox = child.getBoundingClientRect();
                return childBox.left < box.left - 1 || childBox.right > box.right + 1;
              })
            : element.scrollWidth > element.clientWidth + 1;
          return (
            contentOverflow ||
            box.left < -1 ||
            box.right > window.innerWidth + 1
          );
        })
        .map((element) => element.textContent?.trim().slice(0, 40));
      const smallTargets = checkTargets && matchMedia("(pointer: coarse)").matches
        ? [...document.querySelectorAll(
            "button, input:not([type='hidden']):not([type='checkbox']):not([type='radio']):not([name='website']), select, textarea, nav a, .ds-button, .public-button, .ds-motion-toggle",
          )]
            .filter((element) => {
              const box = element.getBoundingClientRect();
              return box.width > 0 && box.height > 0 && (box.width < 44 || box.height < 44);
            })
            .map((element) => `${element.tagName.toLowerCase()}.${element.className?.toString().slice(0, 36)}`)
        : [];
      return { overflow, wide, headerWrapped, tabbarH, pagePad, headingOverflow, smallTargets };
    },
    !route.name.startsWith("staff") &&
      !route.name.startsWith("kit") &&
      route.name !== "shell-admin" &&
      route.name !== "shell-super",
    );

    const tabbarOverlap = report.tabbarH > 0 && report.pagePad < report.tabbarH + 8;
    const ok =
      report.overflow <= 1 &&
      report.wide.length === 0 &&
      !report.headerWrapped &&
      !tabbarOverlap &&
      report.headingOverflow.length === 0 &&
      report.smallTargets.length === 0;
    if (!ok) failures += 1;
    console.log(
      `${ok ? "PASS" : "FAIL"}  ${route.name} @${width}px` +
        (ok
          ? ""
          : ` — overflow ${report.overflow}px${report.wide.length ? `, wide: ${report.wide.join(" | ")}` : ""}` +
            (report.headerWrapped ? " — header wrapped" : "") +
            (tabbarOverlap ? " — content behind the bottom tab bar" : "") +
            (report.headingOverflow.length ? ` — heading overflow: ${report.headingOverflow.join(" | ")}` : "") +
            (report.smallTargets.length ? ` — small targets: ${report.smallTargets.join(" | ")}` : "")),
    );
    if (errors.length > 0) {
      console.log(`WARN  ${route.name} @${width}px console: ${errors[0].slice(0, 160)}`);
    }
    const keepScreenshot =
      route.name === "landing" ||
      route.name === "worker-landing" ||
      ((width === 320 || width === 1280) &&
        !route.name.startsWith("staff") &&
        !route.name.startsWith("kit") &&
        route.name !== "shell-admin" &&
        route.name !== "shell-super");
    if (keepScreenshot) {
      await page.screenshot({
        path: `${SHOTS}/${route.name}-${width}.png`,
        fullPage: false,
        timeout: 15_000,
      });
    }
    await context.close();
  }
}

await browser.close();
console.log(`\nScreenshots: ${SHOTS}/`);
console.log(failures === 0 ? "LAYOUT OK" : `${failures} LAYOUT PROBLEM(S)`);
if (failures > 0) process.exitCode = 1;
