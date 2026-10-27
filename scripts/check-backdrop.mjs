import { mkdirSync, readFileSync } from "node:fs";
import { loadEnv, resolveAppBase } from "./env.mjs";

loadEnv();

const BASE = resolveAppBase();
const SITE_HOST = process.env.NEXT_PUBLIC_SITE_HOST || "zav.localhost:3000";
const STAFF_HOST = process.env.NEXT_PUBLIC_STAFF_HOST || "admin.zav.localhost:3000";
const SHOTS = "tmp/backdrop";
const WIDTHS = [
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
];
const TOLERANCE = 2;

/**
 * The public design is ONE flat warm-paper plane: the page colour comes from
 * --bg, no gradients, no glows, no second wrapper painting over it. This check
 * samples the rendered page and proves exactly that.
 */
const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
function token(name) {
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6});`));
  return match ? match[1] : null;
}
const EXPECTED_BG = token("bg");
const INK = token("ink");
const ACCENT = token("primary");

if (!EXPECTED_BG || !INK || !ACCENT) {
  console.log("FAIL  check-backdrop: --bg, --ink or --primary is missing from globals.css.");
  process.exit(1);
}

const routes = [
  { path: "/", name: "landing" },
  { path: "/login", name: "login" },
  { path: "/register", name: "register" },
  { path: "/terms", name: "terms" },
  { path: "/c", name: "customer", auth: true },
];

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.log("SKIP  check-backdrop: playwright is not installed (npm i -D playwright).");
  process.exit(0);
}

const siteName = SITE_HOST.split(":")[0];
const staffName = STAFF_HOST.split(":")[0];
let browser;
try {
  browser = await chromium.launch({
    args: [
      `--host-resolver-rules=MAP ${siteName} 127.0.0.1, MAP ${staffName} 127.0.0.1`,
    ],
  });
} catch (error) {
  console.log(`SKIP  check-backdrop: chromium could not launch (${error.message}).`);
  console.log("      Run: npx playwright install chromium");
  process.exit(0);
}

mkdirSync(SHOTS, { recursive: true });

const hex = (c) =>
  `#${[c.r, c.g, c.b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase()}`;

function parseHex(value) {
  const raw = value.replace("#", "");
  return {
    r: Number.parseInt(raw.slice(0, 2), 16),
    g: Number.parseInt(raw.slice(2, 4), 16),
    b: Number.parseInt(raw.slice(4, 6), 16),
  };
}

function parseRgb(value) {
  const match = value.match(/rgba?\(([^)]+)\)/);
  if (!match) return null;
  const [r, g, b] = match[1].split(",").map((part) => Number.parseFloat(part.trim()));
  return { r, g, b };
}

const same = (a, b) =>
  Boolean(a && b) &&
  Math.abs(a.r - b.r) <= TOLERANCE &&
  Math.abs(a.g - b.g) <= TOLERANCE &&
  Math.abs(a.b - b.b) <= TOLERANCE;

function luminance({ r, g, b }) {
  const [rr, gg, bb] = [r / 255, g / 255, b / 255].map((v) =>
    v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * rr + 0.7152 * gg + 0.0722 * bb;
}

function contrast(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

function pointsFor(width, height) {
  return [
    { name: "top-left", x: 6, y: 6 },
    { name: "top-right", x: width - 6, y: 6 },
    { name: "bottom-left", x: 6, y: height - 6 },
    { name: "bottom-right", x: width - 6, y: height - 6 },
    { name: "centre", x: width / 2, y: height / 2 },
    { name: "upper-third", x: width * 0.1, y: height * 0.14 },
    { name: "right-third", x: width * 0.9, y: height * 0.2 },
    { name: "bottom-centre", x: width / 2, y: height - 6 },
  ];
}

function heroPointsFor(width, height) {
  return [
    { name: "hero-1", x: width * 0.08, y: height * 0.2 },
    { name: "hero-2", x: width * 0.3, y: height * 0.26 },
    { name: "hero-3", x: width * 0.08, y: height * 0.42 },
    { name: "hero-4", x: width * 0.34, y: height * 0.16 },
    { name: "hero-5", x: width * 0.12, y: height * 0.55 },
  ];
}

/** Read pixels out of a screenshot inside the page (canvas is not available in Node). */
async function samplePixels(page, buffer, points) {
  const dataUrl = `data:image/png;base64,${buffer.toString("base64")}`;
  return page.evaluate(
    async ({ dataUrl, points }) => {
      const image = new Image();
      image.src = dataUrl;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0);
      return points.map((point) => {
        const x = Math.max(0, Math.min(canvas.width - 1, Math.round(point.x)));
        const y = Math.max(0, Math.min(canvas.height - 1, Math.round(point.y)));
        const [r, g, b] = context.getImageData(x, y, 1, 1).data;
        return { name: point.name, r, g, b };
      });
    },
    { dataUrl, points },
  );
}

/**
 * No wrapper may paint a different plane over the page. A full-viewport
 * element is allowed only when its colour matches the page (bg-bg wrappers are
 * the same plane, not a cover).
 */
async function findCovers(page, pageColor) {
  return page.evaluate((pageColor) => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const probes = [
      [width / 2, height / 2],
      [8, 8],
      [width - 8, 8],
      [width / 2, height - 8],
      [8, height / 2],
    ];
    const opaque = (color) => {
      const match = color.match(/rgba?\(([^)]+)\)/);
      if (!match) return false;
      const parts = match[1].split(",").map((part) => part.trim());
      return parts.length < 4 || Number(parts[3]) >= 0.999;
    };
    const sameColor = (color) => {
      const match = color.match(/rgba?\(([^)]+)\)/);
      if (!match) return false;
      const [r, g, b] = match[1].split(",").map((part) => Number.parseFloat(part.trim()));
      return (
        Math.abs(r - pageColor.r) <= 2 &&
        Math.abs(g - pageColor.g) <= 2 &&
        Math.abs(b - pageColor.b) <= 2
      );
    };
    const covers = [];
    for (const [x, y] of probes) {
      for (const element of document.elementsFromPoint(x, y)) {
        if (element.tagName === "HTML" || element.tagName === "BODY") continue;
        const rect = element.getBoundingClientRect();
        if (rect.width < width * 0.9 || rect.height < height * 0.9) continue;
        const style = getComputedStyle(element);
        // Cards are allowed to be opaque (design rules). A long form card on a
        // phone is nearly viewport-wide, so only flat wrappers are a problem.
        if (Number.parseFloat(style.borderTopLeftRadius) >= 8) continue;
        const image = style.backgroundImage !== "none";
        const paints = opaque(style.backgroundColor) && !sameColor(style.backgroundColor);
        if (paints || image) {
          const label = `${element.tagName.toLowerCase()}.${String(element.className).slice(0, 48)}`;
          if (!covers.includes(label)) covers.push(label);
        }
      }
    }
    return covers;
  }, pageColor);
}

const probe = await fetch(`${BASE}/`, {
  headers: { Host: SITE_HOST, "X-Forwarded-Host": SITE_HOST },
  redirect: "manual",
}).catch(() => null);
if (!probe) {
  console.log(`FAIL  check-backdrop: ${BASE} is unreachable. Start the app first (npm start).`);
  await browser.close();
  process.exit(1);
}

let failures = 0;
let checked = 0;
const expectedBg = parseHex(EXPECTED_BG);
const ink = parseHex(INK);
const accent = parseHex(ACCENT);

for (const route of routes) {
  const response = await fetch(`${BASE}${route.path}`, {
    headers: { Host: SITE_HOST, "X-Forwarded-Host": SITE_HOST },
    redirect: "manual",
  }).catch(() => null);

  if (!response || response.status >= 400 || (response.status >= 300 && response.status < 400)) {
    console.log(
      `SKIP  ${route.name} — HTTP ${response ? response.status : "unreachable"}` +
        (route.auth ? " (auth needed)" : ""),
    );
    continue;
  }

  for (const { width, height } of WIDTHS) {
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage();
    await page.goto(`http://${SITE_HOST}${route.path}`, { waitUntil: "networkidle" });

    const pathname = new URL(page.url()).pathname;
    if (route.auth && pathname.startsWith("/login")) {
      console.log(`SKIP  ${route.name} @${width}px — redirected to ${pathname} (auth needed)`);
      await context.close();
      continue;
    }

    const gradients = await page.evaluate(() => {
      const image = getComputedStyle(document.body).backgroundImage;
      return { image, count: (image.match(/gradient\(/g) ?? []).length };
    });
    const bodyColor =
      parseRgb(
        await page.evaluate(() => getComputedStyle(document.body).backgroundColor),
      ) ?? expectedBg;
    const covers = await findCovers(page, bodyColor);

    await page.screenshot({ path: `${SHOTS}/${route.name}-${width}.png` });

    // Hide the content but keep layout: every sampled pixel is the page plane.
    await page.evaluate(() => {
      for (const child of document.body.children) {
        child.style.visibility = "hidden";
      }
    });
    const clean = await page.screenshot({ path: `${SHOTS}/${route.name}-${width}-backdrop.png` });
    const samples = await samplePixels(page, clean, pointsFor(width, height));
    const heroSamples = await samplePixels(page, clean, heroPointsFor(width, height));

    const flat = samples.every((sample) => same(sample, expectedBg)) && same(bodyColor, expectedBg);
    const gradientOk = gradients.count === 0;
    const coverOk = covers.length === 0;
    const inkMin = Math.min(...heroSamples.map((sample) => contrast(ink, sample)));
    const accentMin = Math.min(...heroSamples.map((sample) => contrast(accent, sample)));
    const contrastOk = inkMin >= 7 && accentMin >= 4.5;

    const ok = flat && gradientOk && coverOk && contrastOk;
    if (!ok) failures += 1;
    checked += 1;

    console.log(`\n${ok ? "PASS" : "FAIL"}  ${route.name} @${width}x${height}`);
    console.log(
      `  colours  ${samples.map((sample) => `${sample.name} ${hex(sample)}`).join(" | ")}`,
    );
    console.log(
      `  plane    body ${hex(bodyColor)} vs --bg ${EXPECTED_BG}  ${flat ? "ok" : "FAIL"}`,
    );
    console.log(
      `  cover    ${coverOk ? "none" : covers.join(" | ")}`,
    );
    console.log(
      `  body     ${gradients.count} gradients  ${gradientOk ? "ok" : "FAIL (must be 0)"}`,
    );
    console.log(
      `  contrast ink ${inkMin.toFixed(2)}:1 (min 7), accent ${accentMin.toFixed(2)}:1 (min 4.5)  ` +
        `${contrastOk ? "ok" : "FAIL"}`,
    );

    await context.close();
  }
}

/**
 * Staff routes are deliberately plain: a WHITE page, no frame element and no
 * fixed coloured wrapper. The /__kit shell previews run on the customer host
 * (warm page), so for those the shell root itself must paint the white plane.
 */
const staffRoutes = [
  { path: "/login", name: "staff-login", host: STAFF_HOST, page: true },
  { path: "/security", name: "staff-security", host: STAFF_HOST, auth: true, page: true },
  { path: "/today", name: "staff-today", host: STAFF_HOST, auth: true, page: true },
  { path: "/profile", name: "staff-profile", host: STAFF_HOST, auth: true, page: true },
  { path: "/notifications", name: "staff-notifications", host: STAFF_HOST, auth: true, page: true },
  { path: "/super", name: "staff-super", host: STAFF_HOST, auth: true, page: true },
  { path: "/super/settings", name: "staff-settings", host: STAFF_HOST, auth: true, page: true },
  { path: "/__kit/shell/admin", name: "staff-shell-admin", host: SITE_HOST },
  { path: "/__kit/shell/super", name: "staff-shell-super", host: SITE_HOST },
];

const FRAME_SELECTORS =
  ".staff-app, .paper, .staff-notch, .staff-rail, .staff-dock, .staff-aside, [data-staff-panel]";

for (const route of staffRoutes) {
  const response = await fetch(`${BASE}${route.path}`, {
    headers: { Host: route.host, "X-Forwarded-Host": route.host },
    redirect: "manual",
  }).catch(() => null);
  if (!response || response.status >= 400) {
    console.log(
      `SKIP  ${route.name} — HTTP ${response ? response.status : "unreachable"}` +
        (route.auth ? " (auth needed)" : ""),
    );
    continue;
  }

  for (const { width, height } of WIDTHS) {
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage();
    await page.goto(`http://${route.host}${route.path}`, { waitUntil: "load" });
    await page.waitForTimeout(300);
    const pathname = new URL(page.url()).pathname;
    if (route.auth && pathname.startsWith("/login")) {
      console.log(`SKIP  ${route.name} @${width}px — redirected to ${pathname} (auth needed)`);
      await context.close();
      continue;
    }

    const result = await page.evaluate((selectors) => {
      const body = getComputedStyle(document.body).backgroundColor;
      const htmlBg = getComputedStyle(document.documentElement).backgroundColor;
      const frames = document.querySelectorAll(selectors).length;
      const shell = document.querySelector("[data-staff-shell]");
      return {
        body,
        htmlBg,
        frames,
        tone: document.documentElement.dataset.staffTone ?? "-",
        shell: shell?.getAttribute("data-staff-shell") ?? "-",
        shellBg: shell ? getComputedStyle(shell).backgroundColor : null,
      };
    }, FRAME_SELECTORS);

    const white = (value) => value === "rgb(255, 255, 255)";
    const pageWhite = route.page ? white(result.body) : true;
    const shellWhite = route.page ? true : white(result.shellBg);
    const ok = pageWhite && shellWhite && result.frames === 0 && result.tone !== "public";
    checked += 1;
    if (!ok) failures += 1;
    console.log(
      `\n${ok ? "PASS" : "FAIL"}  ${route.name} @${width}x${height} (tone ${result.tone})`,
    );
    console.log(
      `  page     body ${result.body} html ${result.htmlBg}  ${pageWhite ? "ok" : "FAIL"}`,
    );
    if (!route.page) {
      console.log(
        `  shell    ${result.shellBg}  ${shellWhite ? "ok" : "FAIL (shell must paint white)"}`,
      );
    }
    console.log(
      `  frame    frame elements ${result.frames}  ${result.frames === 0 ? "ok" : "FAIL"}`,
    );
    console.log(`  shell    data-staff-shell=${result.shell}`);
    await page.screenshot({ path: `${SHOTS}/${route.name}-${width}.png` });
    await context.close();
  }
}

await browser.close();
console.log(`\nScreenshots: ${SHOTS}/`);
console.log(
  failures === 0
    ? `BACKDROP OK (${checked} page/width combinations)`
    : `${failures} BACKDROP PROBLEM(S)`,
);
if (failures > 0) process.exitCode = 1;
